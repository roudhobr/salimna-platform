import { Router, Request, Response } from 'express';
import { db } from '../db.js';

export const productsRouter = Router();

// GET all products
productsRouter.get('/', (req: Request, res: Response) => {
  try {
    const { category, search, all } = req.query;
    let query = 'SELECT * FROM products';
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (all !== 'true') {
      conditions.push('is_active = 1');
    }

    if (category && category !== 'Semua') {
      conditions.push('category = ?');
      params.push(String(category));
    }

    if (search) {
      conditions.push('(name LIKE ? OR description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY id ASC';

    const stmt = db.prepare(query);
    const rows = stmt.all(...params) as any[];

    // Parse JSON images
    const products = rows.map(item => ({
      ...item,
      images: JSON.parse(item.images || '[]')
    }));

    res.json({ success: true, data: products });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET single product by ID or slug
productsRouter.get('/:idOrSlug', (req: Request, res: Response) => {
  try {
    const idOrSlug = String(req.params.idOrSlug);
    const isNumeric = /^\d+$/.test(idOrSlug);

    let stmt;
    if (isNumeric) {
      stmt = db.prepare('SELECT * FROM products WHERE id = ?');
    } else {
      stmt = db.prepare('SELECT * FROM products WHERE slug = ?');
    }

    const item = stmt.get(idOrSlug) as any;
    if (!item) {
      return res.status(404).json({ success: false, error: 'Produk tidak ditemukan' });
    }

    item.images = JSON.parse(item.images || '[]');
    res.json({ success: true, data: item });
  } catch (error: any) {
    console.error('Error fetching product:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST create new product
productsRouter.post('/', (req: Request, res: Response) => {
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
      stock
    } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({ success: false, error: 'Nama, harga, dan kategori wajib diisi.' });
    }

    const generatedSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const numPrice = Number(price) || 0;
    const priceFormatted = `Rp ${numPrice.toLocaleString('id-ID')}`;
    const imagesJson = Array.isArray(images) ? JSON.stringify(images) : JSON.stringify([images || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop']);

    const stmt = db.prepare(`
      INSERT INTO products (name, slug, price, price_formatted, category, images, badge, description, buy_link, stock, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    const result = stmt.run(
      name,
      generatedSlug,
      numPrice,
      priceFormatted,
      category,
      imagesJson,
      badge || '',
      description || '',
      buy_link || 'https://wa.me/6282131653815',
      Number(stock) || 10
    );

    const newProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(Number(result.lastInsertRowid)) as any;
    newProduct.images = JSON.parse(newProduct.images || '[]');

    res.status(201).json({ success: true, data: newProduct });
  } catch (error: any) {
    console.error('Error creating product:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT update product
productsRouter.put('/:id', (req: Request, res: Response) => {
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
      is_active
    } = req.body;

    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(Number(id)) as any;
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Produk tidak ditemukan' });
    }

    const numPrice = price !== undefined ? Number(price) : existing.price;
    const priceFormatted = `Rp ${numPrice.toLocaleString('id-ID')}`;
    const imagesJson = images !== undefined ? (Array.isArray(images) ? JSON.stringify(images) : JSON.stringify([images])) : existing.images;

    const stmt = db.prepare(`
      UPDATE products
      SET name = ?,
          slug = ?,
          price = ?,
          price_formatted = ?,
          category = ?,
          images = ?,
          badge = ?,
          description = ?,
          buy_link = ?,
          stock = ?,
          is_active = ?
      WHERE id = ?
    `);

    stmt.run(
      name !== undefined ? name : existing.name,
      slug !== undefined ? slug : existing.slug,
      numPrice,
      priceFormatted,
      category !== undefined ? category : existing.category,
      imagesJson,
      badge !== undefined ? badge : existing.badge,
      description !== undefined ? description : existing.description,
      buy_link !== undefined ? buy_link : existing.buy_link,
      stock !== undefined ? Number(stock) : existing.stock,
      is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active,
      Number(id)
    );

    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(Number(id)) as any;
    updated.images = JSON.parse(updated.images || '[]');

    res.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error updating product:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE product
productsRouter.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM products WHERE id = ?');
    const result = stmt.run(Number(id));

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Produk tidak ditemukan' });
    }

    res.json({ success: true, message: 'Produk berhasil dihapus' });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
