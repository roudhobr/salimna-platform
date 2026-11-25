import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../supabase.js';
import { requireAdminAuth } from '../admin.js';

export const productsRouter = Router();

const requireAdminForAllProducts = (req: Request, res: Response, next: NextFunction) => {
  if (req.query.all === 'true') {
    return requireAdminAuth(req, res, next);
  }
  next();
};

// Helper untuk menormalisasi format images array
const normalizeProduct = (item: any) => {
  if (!item) return item;
  let images = item.images;
  if (typeof images === 'string') {
    try {
      images = JSON.parse(images);
    } catch {
      images = [images];
    }
  }
  return {
    ...item,
    images: Array.isArray(images) ? images : [],
  };
};

// GET all products
productsRouter.get('/', requireAdminForAllProducts, async (req: Request, res: Response) => {
  try {
    const { category, search, all } = req.query;

    let query = supabase.from('products').select('*');

    if (all !== 'true') {
      query = query.eq('is_active', 1);
    }

    if (category && category !== 'Semua') {
      query = query.eq('category', String(category));
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    query = query.order('id', { ascending: true });

    const { data, error } = await query;

    if (error) throw error;

    const products = (data || []).map(normalizeProduct);
    res.json({ success: true, data: products });
  } catch (error: any) {
    console.error('Error fetching products from Supabase:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET single product by ID or slug
productsRouter.get('/:idOrSlug', async (req: Request, res: Response) => {
  try {
    const idOrSlug = String(req.params.idOrSlug);
    const isNumeric = /^\d+$/.test(idOrSlug);

    let query = supabase.from('products').select('*');

    if (isNumeric) {
      query = query.eq('id', Number(idOrSlug));
    } else {
      query = query.eq('slug', idOrSlug);
    }

    const { data, error } = await query.maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ success: false, error: 'Produk tidak ditemukan' });
    }

    if (data.is_active !== 1) {
      return res.status(404).json({ success: false, error: 'Produk tidak ditemukan' });
    }

    res.json({ success: true, data: normalizeProduct(data) });
  } catch (error: any) {
    console.error('Error fetching product from Supabase:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST create new product
productsRouter.post('/', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const {
      name,
      slug,
      price,
      category,
      images,
      badge,
      description,
      buy_link,
      stock,
    } = req.body;

    if (
      typeof name !== 'string' ||
      !name.trim() ||
      name.trim().length > 160 ||
      typeof category !== 'string' ||
      !category.trim()
    ) {
      return res.status(400).json({ success: false, error: 'Nama, harga, dan kategori wajib diisi.' });
    }

    const numPrice = Number(price);
    const numStock = stock === undefined ? 10 : Number(stock);
    if (!Number.isSafeInteger(numPrice) || numPrice < 1 || !Number.isSafeInteger(numStock) || numStock < 0) {
      return res.status(400).json({ success: false, error: 'Harga atau stok produk tidak valid.' });
    }

    const generatedSlug = typeof slug === 'string' && slug.trim()
      ? slug.trim()
      : name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const priceFormatted = `Rp ${numPrice.toLocaleString('id-ID')}`;
    const imagesArray = Array.isArray(images)
      ? images
      : [images || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop'];

    if (imagesArray.length > 8 || imagesArray.some((image: unknown) => typeof image !== 'string' || image.length > 12_000_000)) {
      return res.status(400).json({ success: false, error: 'Jumlah atau ukuran gambar produk melebihi batas.' });
    }

    const { data, error } = await supabase
      .from('products')
      .insert([
        {
          name: name.trim(),
          slug: generatedSlug,
          price: numPrice,
          price_formatted: priceFormatted,
          category: category.trim(),
          images: imagesArray,
          badge: badge || '',
          description: description || '',
          buy_link: buy_link || 'https://wa.me/6282131653815',
          stock: numStock,
          is_active: 1,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data: normalizeProduct(data) });
  } catch (error: any) {
    console.error('Error creating product in Supabase:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT update product
productsRouter.put('/:id', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      slug,
      price,
      category,
      images,
      badge,
      description,
      buy_link,
      stock,
      is_active,
    } = req.body;

    const updatePayload: Record<string, any> = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim() || name.trim().length > 160) {
        return res.status(400).json({ success: false, error: 'Nama produk tidak valid.' });
      }
      updatePayload.name = name.trim();
    }
    if (slug !== undefined) updatePayload.slug = slug;
    if (price !== undefined) {
      const numPrice = Number(price);
      if (!Number.isSafeInteger(numPrice) || numPrice < 1) {
        return res.status(400).json({ success: false, error: 'Harga produk tidak valid.' });
      }
      updatePayload.price = numPrice;
      updatePayload.price_formatted = `Rp ${numPrice.toLocaleString('id-ID')}`;
    }
    if (category !== undefined) updatePayload.category = category;
    if (images !== undefined) {
      const imagesArray = Array.isArray(images) ? images : [images];
      if (imagesArray.length > 8 || imagesArray.some((image: unknown) => typeof image !== 'string' || image.length > 12_000_000)) {
        return res.status(400).json({ success: false, error: 'Jumlah atau ukuran gambar produk melebihi batas.' });
      }
      updatePayload.images = imagesArray;
    }
    if (badge !== undefined) updatePayload.badge = badge;
    if (description !== undefined) updatePayload.description = description;
    if (buy_link !== undefined) updatePayload.buy_link = buy_link;
    if (stock !== undefined) {
      const numStock = Number(stock);
      if (!Number.isSafeInteger(numStock) || numStock < 0) {
        return res.status(400).json({ success: false, error: 'Stok produk tidak valid.' });
      }
      updatePayload.stock = numStock;
    }
    if (is_active !== undefined) updatePayload.is_active = is_active ? 1 : 0;

    const { data, error } = await supabase
      .from('products')
      .update(updatePayload)
      .eq('id', Number(id))
      .select()
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ success: false, error: 'Produk tidak ditemukan' });
    }

    res.json({ success: true, data: normalizeProduct(data) });
  } catch (error: any) {
    console.error('Error updating product in Supabase:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE product
productsRouter.delete('/:id', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('products')
      .update({ is_active: 0 })
      .eq('id', Number(id))
      .select('id')
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ success: false, error: 'Produk tidak ditemukan' });
    }

    res.json({ success: true, message: 'Produk berhasil diarsipkan' });
  } catch (error: any) {
    console.error('Error deleting product from Supabase:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
