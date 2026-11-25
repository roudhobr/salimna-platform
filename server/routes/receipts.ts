import { Router, Request, Response } from 'express';
import { supabase } from '../supabase.js';
import { getOrderNumberFromReceiptToken, isOrderReceiptConfigured } from '../services/orderReceipt.js';

export const receiptsRouter = Router();

receiptsRouter.get('/:token', async (req: Request, res: Response) => {
  if (!isOrderReceiptConfigured()) {
    return res.status(503).json({ success: false, error: 'Portal nota belum dikonfigurasi.' });
  }

  try {
    const tokenParam = req.params.token;
    const token = Array.isArray(tokenParam) ? tokenParam[0] || '' : tokenParam;
    const orderNumber = getOrderNumberFromReceiptToken(token);
    if (!orderNumber) {
      return res.status(404).json({ success: false, error: 'Nota tidak ditemukan.' });
    }

    const { data, error } = await supabase
      .from('orders')
      .select('order_number,created_at,status,items,total_amount')
      .eq('order_number', orderNumber)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, error: 'Nota tidak ditemukan.' });

    let items = data.items;
    if (typeof items === 'string') {
      try {
        items = JSON.parse(items);
      } catch {
        throw new Error('Rincian item pesanan tidak valid.');
      }
    }
    if (!Array.isArray(items)) throw new Error('Rincian item pesanan tidak valid.');

    res.json({
      success: true,
      data: {
        order_number: data.order_number,
        created_at: data.created_at,
        status: data.status,
        items: items.map((item: any) => ({
          name: String(item.name || 'Produk'),
          price: Number(item.price || 0),
          qty: Number(item.qty || 0),
          size: typeof item.size === 'string' ? item.size : '',
        })),
        total_amount: Number(data.total_amount || 0),
      },
    });
  } catch (error: any) {
    console.error('Error fetching order receipt:', error);
    res.status(500).json({ success: false, error: 'Gagal memuat nota pesanan.' });
  }
});
