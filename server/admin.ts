import { Router, Request, Response, NextFunction } from 'express';
import { isSupabaseConfigured, supabase } from './supabase.js';
import { createOrderReceiptToken, isOrderReceiptConfigured } from './services/orderReceipt.js';

const adminRouter = Router();
const ADMIN_EMAILS = new Set(
  (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean)
);

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

const getTokenFromRequest = (req: Request) => {
  const authHeader = req.headers.authorization || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
};

const requireAdminAuth = async (req: Request, res: Response, next: NextFunction) => {
  if (!isSupabaseConfigured() || ADMIN_EMAILS.size === 0) {
    return res.status(503).json({
      success: false,
      error: 'Admin belum dikonfigurasi. Atur SUPABASE_SERVICE_ROLE_KEY dan ADMIN_EMAILS.',
    });
  }

  const token = getTokenFromRequest(req);
  if (!token) {
    return res.status(401).json({ success: false, error: 'Unauthorized: sesi Supabase diperlukan.' });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ success: false, error: 'Unauthorized: sesi Supabase tidak valid atau sudah kedaluwarsa.' });
    }

    const email = user.email?.trim().toLowerCase();
    if (!email || !user.email_confirmed_at || !ADMIN_EMAILS.has(email)) {
      return res.status(403).json({ success: false, error: 'Akun ini tidak memiliki akses admin.' });
    }

    (req as any).admin = { email, role: 'admin' };
    return next();
  } catch (error) {
    console.error('Error validating Supabase admin session:', error);
    return res.status(503).json({ success: false, error: 'Tidak dapat memverifikasi sesi admin ke Supabase.' });
  }
};

const buildCsv = (rows: any[]) => {
  if (!rows.length) {
    return 'order_number,customer_name,customer_phone,customer_email,shipping_address,status,total_amount,created_at\n';
  }

  const headers = Object.keys(rows[0]);
  const escapeCell = (value: any) => {
    const rawValue = value == null ? '' : String(value);
    const safeValue = /^[\t\r=+\-@]/.test(rawValue) ? `'${rawValue}` : rawValue;
    return `"${safeValue.replace(/"/g, '""')}"`;
  };

  const csvRows = [
    headers.join(','),
    ...rows.map(row => headers.map(header => escapeCell(row[header])).join(',')),
  ];

  return `${csvRows.join('\n')}\n`;
};

adminRouter.get('/me', requireAdminAuth, (req: Request, res: Response) => {
  res.json({
    success: true,
    data: { email: (req as any).admin.email, role: (req as any).admin.role },
  });
});

adminRouter.get('/orders', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const status = String(req.query.status || '').trim();
    let query = supabase.from('orders').select('*').order('id', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;

    const orders = (data || []).map((order: any) => {
      const normalized = normalizeOrder(order);
      return isOrderReceiptConfigured()
        ? { ...normalized, receipt_token: createOrderReceiptToken(normalized.order_number) }
        : normalized;
    });

    res.json({ success: true, data: orders });
  } catch (error: any) {
    console.error('Error fetching admin orders:', error);
    res.status(500).json({ success: false, error: error.message || 'Gagal memuat pesanan admin.' });
  }
});

adminRouter.get('/orders/export.csv', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const status = String(req.query.status || '').trim();

    let query = supabase.from('orders').select('*').order('id', { ascending: false });
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;

    const rows = (data || []).map((order: any) => ({
      order_number: order.order_number,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      customer_email: order.customer_email,
      shipping_address: order.shipping_address,
      status: order.status,
      total_amount: Number(order.total_amount || 0),
      created_at: order.created_at,
    }));

    const csv = buildCsv(rows);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="salimna-orders-${Date.now()}.csv"`);
    return res.send(csv);
  } catch (error: any) {
    console.error('Error exporting admin orders CSV:', error);
    return res.status(500).json({ success: false, error: error.message || 'Gagal mengekspor data CSV.' });
  }
});

adminRouter.delete('/orders/:id', requireAdminAuth, async (req: Request, res: Response) => {
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

    res.json({ success: true, message: 'Pesanan berhasil dihapus.' });
  } catch (error: any) {
    console.error('Error deleting admin order:', error);
    res.status(500).json({ success: false, error: error.message || 'Gagal menghapus pesanan.' });
  }
});

adminRouter.delete('/orders', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const days = Number(req.query.days || 30);
    const status = String(req.query.status || 'completed').trim() || 'completed';
    const validStatuses = ['all', 'completed', 'cancelled'];
    if (!Number.isInteger(days) || days < 1 || days > 3650 || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Rentang hari atau status penghapusan tidak valid.' });
    }
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    let query = supabase
      .from('orders')
      .delete()
      .lt('created_at', cutoff);

    if (status === 'all') {
      query = query.in('status', ['completed', 'cancelled']);
    } else {
      query = query.eq('status', status);
    }

    const { error } = await query;

    if (error) throw error;

    res.json({ success: true, message: `Pesanan ${status} lama berhasil dihapus.` });
  } catch (error: any) {
    console.error('Error deleting old orders:', error);
    res.status(500).json({ success: false, error: error.message || 'Gagal menghapus pesanan lama.' });
  }
});

export { adminRouter, requireAdminAuth };
