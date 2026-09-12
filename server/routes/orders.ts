import { Router, Request, Response } from 'express';
import { db } from '../db.js';

export const ordersRouter = Router();

// GET all orders (for Admin)
ordersRouter.get('/', (req: Request, res: Response) => {
  try {
    const stmt = db.prepare('SELECT * FROM orders ORDER BY id DESC');
    const rows = stmt.all() as any[];

    const orders = rows.map(item => ({
      ...item,
      items: JSON.parse(item.items || '[]')
    }));

    res.json({ success: true, data: orders });
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET single order
ordersRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const item = db.prepare('SELECT * FROM orders WHERE id = ? OR order_number = ?').get(id, id) as any;
    if (!item) {
      return res.status(404).json({ success: false, error: 'Pesanan tidak ditemukan' });
    }

    item.items = JSON.parse(item.items || '[]');
    res.json({ success: true, data: item });
  } catch (error: any) {
    console.error('Error fetching order:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST create order (Checkout)
ordersRouter.post('/', (req: Request, res: Response) => {
  try {
    const {
      customer_name,
      customer_email,
      customer_phone,
      shipping_address,
      items,
      notes
    } = req.body;

    if (!customer_name || !customer_phone || !shipping_address || !items || !items.length) {
      return res.status(400).json({
        success: false,
        error: 'Nama, telepon, alamat pengiriman, dan item pesanan wajib diisi.'
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

    const stmt = db.prepare(`
      INSERT INTO orders (order_number, customer_name, customer_email, customer_phone, shipping_address, items, total_amount, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `);

    const result = stmt.run(
      orderNumber,
      customer_name,
      customer_email || '-',
      customer_phone,
      shipping_address,
      JSON.stringify(items),
      totalAmount,
      notes || ''
    );

    // Decrement stock for purchased items
    for (const item of items) {
      if (item.id) {
        db.prepare('UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?').run(Number(item.qty) || 1, Number(item.id));
      }
    }

    const newOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(Number(result.lastInsertRowid)) as any;
    newOrder.items = JSON.parse(newOrder.items || '[]');

    res.status(201).json({
      success: true,
      message: 'Pesanan berhasil dibuat',
      data: newOrder
    });
  } catch (error: any) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT update order status
ordersRouter.put('/:id/status', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'shipped', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Status tidak valid. Harus salah satu dari: ${validStatuses.join(', ')}`
      });
    }

    const stmt = db.prepare('UPDATE orders SET status = ? WHERE id = ?');
    const result = stmt.run(status, Number(id));

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Pesanan tidak ditemukan' });
    }

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(Number(id)) as any;
    updated.items = JSON.parse(updated.items || '[]');

    res.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error updating order status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
