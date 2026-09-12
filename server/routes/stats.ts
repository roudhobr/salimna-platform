import { Router, Request, Response } from 'express';
import { db } from '../db.js';

export const statsRouter = Router();

statsRouter.get('/', (_req: Request, res: Response) => {
  try {
    const productsCount = (db.prepare('SELECT COUNT(*) as count FROM products WHERE is_active = 1').get() as any).count;
    const articlesCount = (db.prepare('SELECT COUNT(*) as count FROM articles WHERE is_published = 1').get() as any).count;
    const ordersCount = (db.prepare('SELECT COUNT(*) as count FROM orders').get() as any).count;
    const revenueRow = db.prepare("SELECT SUM(total_amount) as total FROM orders WHERE status != 'cancelled'").get() as any;
    const totalRevenue = revenueRow.total || 0;

    const recentOrders = (db.prepare('SELECT * FROM orders ORDER BY id DESC LIMIT 5').all() as any[]).map(o => ({
      ...o,
      items: JSON.parse(o.items || '[]')
    }));

    const recentArticles = db.prepare('SELECT id, title, category, date FROM articles ORDER BY id DESC LIMIT 3').all();

    res.json({
      success: true,
      data: {
        totalProducts: productsCount,
        totalArticles: articlesCount,
        totalOrders: ordersCount,
        totalRevenue,
        totalRevenueFormatted: `Rp ${totalRevenue.toLocaleString('id-ID')}`,
        recentOrders,
        recentArticles
      }
    });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
