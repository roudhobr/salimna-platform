import { Router, Request, Response } from 'express';
import { supabase } from '../supabase.js';

export const productsRouter = Router();

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
productsRouter.get('/', async (req: Request, res: Response) => {
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

    res.json({ success: true, data: normalizeProduct(data) });
  } catch (error: any) {
    console.error('Error fetching product from Supabase:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST create new product
productsRouter.post('/', async (req: Request, res: Response) => {
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

    if (!name || !price || !category) {
      return res.status(400).json({ success: false, error: 'Nama, harga, dan kategori wajib diisi.' });
    }

    const generatedSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const numPrice = Number(price) || 0;
    const priceFormatted = `Rp ${numPrice.toLocaleString('id-ID')}`;
    const imagesArray = Array.isArray(images)
      ? images
      : [images || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop'];

    const { data, error } = await supabase
      .from('products')
      .insert([
        {
          name,
          slug: generatedSlug,
          price: numPrice,
          price_formatted: priceFormatted,
          category,
          images: imagesArray,
          badge: badge || '',
          description: description || '',
          buy_link: buy_link || 'https://wa.me/6282131653815',
          stock: Number(stock) || 10,
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
productsRouter.put('/:id', async (req: Request, res: Response) => {
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

    if (name !== undefined) updatePayload.name = name;
    if (slug !== undefined) updatePayload.slug = slug;
    if (price !== undefined) {
      const numPrice = Number(price);
      updatePayload.price = numPrice;
      updatePayload.price_formatted = `Rp ${numPrice.toLocaleString('id-ID')}`;
    }
    if (category !== undefined) updatePayload.category = category;
    if (images !== undefined) updatePayload.images = Array.isArray(images) ? images : [images];
    if (badge !== undefined) updatePayload.badge = badge;
    if (description !== undefined) updatePayload.description = description;
    if (buy_link !== undefined) updatePayload.buy_link = buy_link;
    if (stock !== undefined) updatePayload.stock = Number(stock);
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
productsRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', Number(id));

    if (error) throw error;

    res.json({ success: true, message: 'Produk berhasil dihapus' });
  } catch (error: any) {
    console.error('Error deleting product from Supabase:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
