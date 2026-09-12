import { Router, Request, Response } from 'express';
import { db } from '../db.js';

export const articlesRouter = Router();

// GET all articles
articlesRouter.get('/', (req: Request, res: Response) => {
  try {
    const { category, search, all } = req.query;
    let query = 'SELECT * FROM articles';
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (all !== 'true') {
      conditions.push('is_published = 1');
    }

    if (category && category !== 'Semua') {
      conditions.push('category = ?');
      params.push(String(category));
    }

    if (search) {
      conditions.push('(title LIKE ? OR description LIKE ? OR content LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY id DESC';

    const stmt = db.prepare(query);
    const articles = stmt.all(...params);

    res.json({ success: true, data: articles });
  } catch (error: any) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET single article by ID or slug
articlesRouter.get('/:idOrSlug', (req: Request, res: Response) => {
  try {
    const idOrSlug = String(req.params.idOrSlug);
    const isNumeric = /^\d+$/.test(idOrSlug);

    let stmt;
    if (isNumeric) {
      stmt = db.prepare('SELECT * FROM articles WHERE id = ?');
    } else {
      stmt = db.prepare('SELECT * FROM articles WHERE slug = ?');
    }

    const item = stmt.get(idOrSlug);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Artikel tidak ditemukan' });
    }

    res.json({ success: true, data: item });
  } catch (error: any) {
    console.error('Error fetching article:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST create article
articlesRouter.post('/', (req: Request, res: Response) => {
  try {
    const {
      title,
      slug,
      category,
      date,
      description,
      content,
      image,
      author,
      read_time
    } = req.body;

    if (!title || !description || !content) {
      return res.status(400).json({ success: false, error: 'Judul, deskripsi, dan konten artikel wajib diisi.' });
    }

    const generatedSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const articleDate = date || new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date());

    const stmt = db.prepare(`
      INSERT INTO articles (title, slug, category, date, description, content, image, author, read_time, is_published)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    const result = stmt.run(
      title,
      generatedSlug,
      category || 'Sosial',
      articleDate,
      description,
      content,
      image || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=800&auto=format&fit=crop',
      author || 'Tim Riset Salimna',
      read_time || '5 mnt'
    );

    const newArticle = db.prepare('SELECT * FROM articles WHERE id = ?').get(Number(result.lastInsertRowid));
    res.status(201).json({ success: true, data: newArticle });
  } catch (error: any) {
    console.error('Error creating article:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT update article
articlesRouter.put('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      slug,
      category,
      date,
      description,
      content,
      image,
      author,
      read_time,
      is_published
    } = req.body;

    const existing = db.prepare('SELECT * FROM articles WHERE id = ?').get(Number(id)) as any;
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Artikel tidak ditemukan' });
    }

    const stmt = db.prepare(`
      UPDATE articles
      SET title = ?,
          slug = ?,
          category = ?,
          date = ?,
          description = ?,
          content = ?,
          image = ?,
          author = ?,
          read_time = ?,
          is_published = ?
      WHERE id = ?
    `);

    stmt.run(
      title !== undefined ? title : existing.title,
      slug !== undefined ? slug : existing.slug,
      category !== undefined ? category : existing.category,
      date !== undefined ? date : existing.date,
      description !== undefined ? description : existing.description,
      content !== undefined ? content : existing.content,
      image !== undefined ? image : existing.image,
      author !== undefined ? author : existing.author,
      read_time !== undefined ? read_time : existing.read_time,
      is_published !== undefined ? (is_published ? 1 : 0) : existing.is_published,
      Number(id)
    );

    const updated = db.prepare('SELECT * FROM articles WHERE id = ?').get(Number(id));
    res.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error updating article:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE article
articlesRouter.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM articles WHERE id = ?');
    const result = stmt.run(Number(id));

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Artikel tidak ditemukan' });
    }

    res.json({ success: true, message: 'Artikel berhasil dihapus' });
  } catch (error: any) {
    console.error('Error deleting article:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
