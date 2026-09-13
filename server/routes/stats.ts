import { Router, Request, Response } from 'express';
import { supabase } from '../supabase.js';

export const statsRouter = Router();

statsRouter.get('/', async (_req: Request, res: Response) => {
  try {
    // 1. Hitung jumlah produk aktif
    const { count: productsCount, error: prodErr } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', 1);

    if (prodErr) throw prodErr;

    // 2. Hitung jumlah artikel terbit
    const { count: articlesCount, error: artErr } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', 1);

    if (artErr) throw artErr;

    // 3. Hitung jumlah order
    const { count: ordersCount, error: ordErr } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    if (ordErr) throw ordErr;

    // 4. Hitung total revenue dari order yang tidak dibatalkan
    const { data: revenueData, error: revErr } = await supabase
      .from('orders')
      .select('total_amount, status')
      .neq('status', 'cancelled');

    if (revErr) throw revErr;

    const totalRevenue = (revenueData || []).reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

    // 5. 5 pesanan terbaru
    const { data: recentOrdersData, error: recOrdErr } = await supabase
      .from('orders')
      .select('*')
      .order('id', { ascending: false })
      .limit(5);

    if (recOrdErr) throw recOrdErr;

    const recentOrders = (recentOrdersData || []).map(o => {
      let items = o.items;
      if (typeof items === 'string') {
        try {
          items = JSON.parse(items);
        } catch {
          items = [];
        }
      }
      return {
        ...o,
        items: Array.isArray(items) ? items : [],
      };
    });

    // 6. 3 artikel terbaru
    const { data: recentArticles, error: recArtErr } = await supabase
      .from('articles')
      .select('id, title, category, date')
      .order('id', { ascending: false })
      .limit(3);

    if (recArtErr) throw recArtErr;

    res.json({
      success: true,
      data: {
        totalProducts: productsCount || 0,
        totalArticles: articlesCount || 0,
        totalOrders: ordersCount || 0,
        totalRevenue,
        totalRevenueFormatted: `Rp ${totalRevenue.toLocaleString('id-ID')}`,
        recentOrders,
        recentArticles: recentArticles || [],
      },
    });
  } catch (error: any) {
    console.error('Error fetching stats from Supabase:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
