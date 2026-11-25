import { Router, Request, Response } from 'express';
import { supabase } from '../supabase.js';
import { requireAdminAuth } from '../admin.js';
import { randomBytes } from 'crypto';
import { createOrderReceiptToken, isOrderReceiptConfigured } from '../services/orderReceipt.js';

export const ordersRouter = Router();

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
ordersRouter.get('/', requireAdminAuth, async (_req: Request, res: Response) => {
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
ordersRouter.get('/:id', requireAdminAuth, async (req: Request, res: Response) => {
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

    const order = normalizeOrder(data);
    if (isOrderReceiptConfigured()) {
      order.receipt_token = createOrderReceiptToken(order.order_number);
    }

    res.json({ success: true, data: order });
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

    if (
      typeof customer_name !== 'string' ||
      customer_name.trim().length < 2 ||
      customer_name.trim().length > 120 ||
      typeof customer_phone !== 'string' ||
      !/^[+\d\s().-]{8,24}$/.test(customer_phone.trim()) ||
      customer_phone.replace(/\D/g, '').length < 8 ||
      customer_phone.replace(/\D/g, '').length > 15 ||
      typeof shipping_address !== 'string' ||
      shipping_address.trim().length < 8 ||
      shipping_address.trim().length > 1000 ||
      !Array.isArray(items) ||
      items.length < 1 ||
      items.length > 50
    ) {
      return res.status(400).json({
        success: false,
        error: 'Data pelanggan atau item pesanan tidak valid.',
      });
    }

    const email = typeof customer_email === 'string' ? customer_email.trim() : '';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, error: 'Format email tidak valid.' });
    }

    const requestedItems: Array<{ id: number; qty: number; size: string }> = [];
    for (const item of items) {
      const id = Number(item?.id);
      const qty = Number(item?.qty);
      const size = typeof item?.size === 'string' ? item.size.trim() : '';
      if (!Number.isSafeInteger(id) || id < 1 || !Number.isSafeInteger(qty) || qty < 1 || qty > 99 || size.length > 20) {
        return res.status(400).json({ success: false, error: 'Item pesanan tidak valid.' });
      }
      requestedItems.push({ id, qty, size });
    }

    const orderNumber = `SLM-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString('hex').toUpperCase()}`;
    const { data: newOrder, error: orderError } = await supabase.rpc('create_order_with_stock', {
      p_order: {
        order_number: orderNumber,
        customer_name: customer_name.trim(),
        customer_email: email.slice(0, 254),
        customer_phone: customer_phone.trim(),
        shipping_address: shipping_address.trim(),
        items: requestedItems,
        notes: typeof notes === 'string' ? notes.trim().slice(0, 1000) : '',
      },
    });

    if (orderError?.code === 'P0001') {
      return res.status(409).json({ success: false, error: orderError.message });
    }
    if (orderError) throw orderError;
    if (!newOrder || typeof newOrder !== 'object') {
      throw new Error('Database tidak mengembalikan pesanan yang berhasil dibuat.');
    }

    const payload = normalizeOrder(newOrder);
    if (isOrderReceiptConfigured()) {
      payload.receipt_token = createOrderReceiptToken(orderNumber);
    }

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
ordersRouter.put('/:id/status', requireAdminAuth, async (req: Request, res: Response) => {
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

    const { data, error } = await supabase.rpc('update_order_status_with_stock', {
      p_order_id: Number(id),
      p_status: status,
    });

    if (error?.code === 'P0001') {
      return res.status(409).json({ success: false, error: error.message });
    }
    if (error) throw error;

    if (!data) {
      return res.status(404).json({ success: false, error: 'Pesanan tidak ditemukan' });
    }

    const updatedOrder = normalizeOrder(data);
    if (isOrderReceiptConfigured()) {
      updatedOrder.receipt_token = createOrderReceiptToken(updatedOrder.order_number);
    }

    res.json({ success: true, data: updatedOrder });
  } catch (error: any) {
    console.error('Error updating order status in Supabase:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE order
ordersRouter.delete('/:id', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const orderId = Number(id);
    if (!Number.isSafeInteger(orderId) || orderId < 1) {
      return res.status(400).json({ success: false, error: 'ID pesanan tidak valid.' });
    }

    const { data, error } = await supabase.rpc('delete_closed_order', { p_order_id: orderId });

    if (error?.code === 'P0001') {
      return res.status(409).json({ success: false, error: error.message });
    }
    if (error) throw error;
    if (!data) {
      return res.status(404).json({ success: false, error: 'Pesanan tidak ditemukan.' });
    }

    res.json({ success: true, message: 'Pesanan berhasil dihapus' });
  } catch (error: any) {
    console.error('Error deleting order:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
