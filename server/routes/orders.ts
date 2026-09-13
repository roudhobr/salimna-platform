import { Router, Request, Response } from 'express';
import { supabase } from '../supabase.js';
import { buildOrderWhatsAppMessage, formatRupiah, sendOrderWhatsAppMessage } from '../services/whatsapp.js';

export const ordersRouter = Router();

const hasWhatsappStatusColumn = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('orders').select('whatsapp_status').limit(1);
    if (error) {
      const message = String(error.message || '');
      if (message.toLowerCase().includes('whatsapp_status') && message.toLowerCase().includes('column')) {
        return false;
      }
      throw error;
    }
    return true;
  } catch {
    return false;
  }
};

// Helper untuk menormalisasi item pesanan
const normalizeOrder = (order: any) => {
  if (!order) return order;
  let items = order.items;
  if (typeof items === 'string') {
    try {
      items = JSON.parse(items);
    } catch {
      items = [];
    }
  }
  return {
    ...order,
    items: Array.isArray(items) ? items : [],
  };
};

// GET all orders (for Admin)
ordersRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('id', { ascending: false });

    if (error) throw error;

    const orders = (data || []).map(normalizeOrder);
    res.json({ success: true, data: orders });
  } catch (error: any) {
    console.error('Error fetching orders from Supabase:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET single order
ordersRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const isNumeric = /^\d+$/.test(id);

    let query = supabase.from('orders').select('*');

    if (isNumeric) {
      query = query.or(`id.eq.${id},order_number.eq.${id}`);
    } else {
      query = query.eq('order_number', id);
    }

    const { data, error } = await query.maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ success: false, error: 'Pesanan tidak ditemukan' });
    }

    res.json({ success: true, data: normalizeOrder(data) });
  } catch (error: any) {
    console.error('Error fetching order from Supabase:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST create order (Checkout)
ordersRouter.post('/', async (req: Request, res: Response) => {
  try {
    const {
      customer_name,
      customer_email,
      customer_phone,
      shipping_address,
      items,
      notes,
    } = req.body;

    if (!customer_name || !customer_phone || !shipping_address || !items || !items.length) {
      return res.status(400).json({
        success: false,
        error: 'Nama, telepon, alamat pengiriman, dan item pesanan wajib diisi.',
      });
    }

    // Calculate total amount
    let totalAmount = 0;
    for (const item of items) {
      totalAmount += (Number(item.price) || 0) * (Number(item.qty) || 1);
    }

    // Generate unique order number
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 900 + 100);
    const orderNumber = `SLM-${timestamp}-${random}`;

    const supportsWhatsappStatus = await hasWhatsappStatusColumn();

    // Insert order into Supabase
    const orderPayload: any = {
      order_number: orderNumber,
      customer_name,
      customer_email: customer_email || '-',
      customer_phone,
      shipping_address,
      items: items,
      total_amount: totalAmount,
      status: 'pending',
      notes: notes || '',
    };

    if (supportsWhatsappStatus) {
      orderPayload.whatsapp_status = 'pending';
    }

    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert([orderPayload])
      .select()
      .single();

    if (orderError) throw orderError;

    let whatsappStatus = 'pending';
    let whatsappMessage = '';

    try {
      const result = await sendOrderWhatsAppMessage({
        order_number: orderNumber,
        customer_name,
        customer_phone,
        items,
        total_amount: totalAmount,
      });

      whatsappStatus = result.status;
      whatsappMessage = buildOrderWhatsAppMessage({
        order_number: orderNumber,
        customer_name,
        customer_phone,
        items,
        total_amount: totalAmount,
      });

      if (result.status === 'sent' && supportsWhatsappStatus) {
        await supabase
          .from('orders')
          .update({ whatsapp_status: 'sent' })
          .eq('id', newOrder.id);
      }
    } catch (error: any) {
      console.error('Error sending WhatsApp order message:', error);
      whatsappStatus = 'pending';
      whatsappMessage = buildOrderWhatsAppMessage({
        order_number: orderNumber,
        customer_name,
        customer_phone,
        items,
        total_amount: totalAmount,
      });

      if (supportsWhatsappStatus) {
        const pendingUpdate = await supabase
          .from('orders')
          .update({ whatsapp_status: 'pending' })
          .eq('id', newOrder.id);

        if (pendingUpdate.error) {
          console.error('Unable to persist pending WhatsApp status:', pendingUpdate.error);
        }
      }
    }

    // Decrement stock for purchased items
    for (const item of items) {
      if (item.id) {
        // Ambil stok saat ini
        const { data: currentProduct } = await supabase
          .from('products')
          .select('stock')
          .eq('id', Number(item.id))
          .maybeSingle();

        if (currentProduct) {
          const newStock = Math.max(0, (currentProduct.stock || 0) - (Number(item.qty) || 1));
          await supabase
            .from('products')
            .update({ stock: newStock })
            .eq('id', Number(item.id));
        }
      }
    }

    const payload = normalizeOrder(newOrder);
    payload.whatsapp_status = whatsappStatus;
    payload.whatsapp_message = whatsappMessage;
    payload.total_amount_formatted = formatRupiah(totalAmount);

    res.status(201).json({
      success: true,
      message: 'Pesanan berhasil dibuat',
      data: payload,
    });
  } catch (error: any) {
    console.error('Error creating order in Supabase:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT update order status
ordersRouter.put('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'shipped', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Status tidak valid. Harus salah satu dari: ${validStatuses.join(', ')}`,
      });
    }

    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', Number(id))
      .select()
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ success: false, error: 'Pesanan tidak ditemukan' });
    }

    res.json({ success: true, data: normalizeOrder(data) });
  } catch (error: any) {
    console.error('Error updating order status in Supabase:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
