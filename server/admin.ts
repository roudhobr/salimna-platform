import crypto from 'crypto';
import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from './supabase.js';

const adminRouter = Router();

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'salimna';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || 'salimna-admin-secret';
const ADMIN_SESSION_TTL_MS = 1000 * 60 * 60 * 12;

const sessions = new Map<string, { username: string; expiresAt: number }>();

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

const buildSignedToken = (username: string, issuedAt: number) => {
  const payload = JSON.stringify({ username, issuedAt, expiresAt: issuedAt + ADMIN_SESSION_TTL_MS });
  const encodedPayload = Buffer.from(payload, 'utf8').toString('base64url');
  const signature = crypto
    .createHmac('sha256', ADMIN_SESSION_SECRET)
    .update(encodedPayload)
    .digest('base64url');

  return `${encodedPayload}.${signature}`;
};

const verifyToken = (token: string) => {
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [encodedPayload, signature] = parts;
  const expectedSignature = crypto
    .createHmac('sha256', ADMIN_SESSION_SECRET)
    .update(encodedPayload)
    .digest('base64url');

  const signatureBuffer = Buffer.from(signature);
  const expectedSignatureBuffer = Buffer.from(expectedSignature);
  if (signatureBuffer.length === expectedSignatureBuffer.length && crypto.timingSafeEqual(signatureBuffer, expectedSignatureBuffer)) {
    try {
      const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as {
        username: string;
        issuedAt: number;
        expiresAt: number;
      };

      if (!payload.username || payload.expiresAt <= Date.now()) {
        return null;
      }

      return payload;
    } catch {
      return null;
    }
  }

  return null;
};

const getTokenFromRequest = (req: Request) => {
  const authHeader = req.headers.authorization || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
};

const requireAdminAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = getTokenFromRequest(req);
  if (!token) {
    return res.status(401).json({ success: false, error: 'Unauthorized: token admin diperlukan.' });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ success: false, error: 'Unauthorized: token admin tidak valid atau sudah kedaluwarsa.' });
  }

  const hashedKey = crypto.createHash('sha256').update(token).digest('hex');
  const session = sessions.get(hashedKey);

  if (!session || session.username !== payload.username || session.expiresAt < Date.now()) {
    sessions.delete(hashedKey);
    return res.status(401).json({ success: false, error: 'Unauthorized: sesi admin tidak ditemukan.' });
  }

  (req as any).admin = { username: payload.username, role: 'admin' };
  next();
};

const buildCsv = (rows: any[]) => {
  if (!rows.length) {
    return 'order_number,customer_name,customer_phone,customer_email,shipping_address,status,total_amount,created_at\n';
  }

  const headers = Object.keys(rows[0]);
  const escapeCell = (value: any) => {
    const safeValue = value == null ? '' : String(value).replace(/"/g, '""');
    return `"${safeValue}"`;
  };

  const csvRows = [
    headers.join(','),
    ...rows.map(row => headers.map(header => escapeCell(row[header])).join(',')),
  ];

  return `${csvRows.join('\n')}\n`;
};

adminRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username dan password wajib diisi.' });
    }

    if (String(username).trim() !== ADMIN_USERNAME || String(password) !== ADMIN_PASSWORD) {
      return res.status(401).json({ success: false, error: 'Username atau password admin salah.' });
    }

    const issuedAt = Date.now();
    const token = buildSignedToken(ADMIN_USERNAME, issuedAt);
    const hashedKey = crypto.createHash('sha256').update(token).digest('hex');

    sessions.set(hashedKey, {
      username: ADMIN_USERNAME,
      expiresAt: issuedAt + ADMIN_SESSION_TTL_MS,
    });

    return res.json({
      success: true,
      data: {
        token,
        user: { username: ADMIN_USERNAME, role: 'admin' },
        expiresAt: issuedAt + ADMIN_SESSION_TTL_MS,
      },
    });
  } catch (error: any) {
    console.error('Error creating admin session:', error);
    return res.status(500).json({ success: false, error: error.message || 'Gagal membuat sesi admin.' });
  }
});

adminRouter.post('/logout', requireAdminAuth, (req: Request, res: Response) => {
  const token = getTokenFromRequest(req);
  if (token) {
    const hashedKey = crypto.createHash('sha256').update(token).digest('hex');
    sessions.delete(hashedKey);
  }

  return res.json({ success: true, message: 'Logout admin berhasil.' });
});

adminRouter.get('/me', requireAdminAuth, (req: Request, res: Response) => {
  res.json({
    success: true,
    data: { username: (req as any).admin.username, role: (req as any).admin.role },
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

    res.json({ success: true, data: (data || []).map(normalizeOrder) });
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
    const { error } = await supabase.from('orders').delete().eq('id', Number(id));
    if (error) throw error;

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
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    let query = supabase
      .from('orders')
      .delete()
      .lt('created_at', cutoff);

    if (status !== 'all') {
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
