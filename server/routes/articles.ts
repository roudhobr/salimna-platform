import { Router, Request, Response } from 'express';
import { supabase } from '../supabase.js';

export const articlesRouter = Router();

// GET all articles
articlesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { category, search, all } = req.query;

    let query = supabase.from('articles').select('*');

    if (all !== 'true') {
      query = query.eq('is_published', 1);
    }

    if (category && category !== 'Semua') {
      query = query.eq('category', String(category));
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,content.ilike.%${search}%`);
    }

    query = query.order('id', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    res.json({ success: true, data: data || [] });
  } catch (error: any) {
    console.error('Error fetching articles from Supabase:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET single article by ID or slug
articlesRouter.get('/:idOrSlug', async (req: Request, res: Response) => {
  try {
    const idOrSlug = String(req.params.idOrSlug);
    const isNumeric = /^\d+$/.test(idOrSlug);

    let query = supabase.from('articles').select('*');

    if (isNumeric) {
      query = query.eq('id', Number(idOrSlug));
    } else {
      query = query.eq('slug', idOrSlug);
    }

    const { data, error } = await query.maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ success: false, error: 'Artikel tidak ditemukan' });
    }

    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Error fetching article from Supabase:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST create article
articlesRouter.post('/', async (req: Request, res: Response) => {
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
      read_time,
    } = req.body;

    if (!title || !description || !content) {
      return res.status(400).json({ success: false, error: 'Judul, deskripsi, dan konten artikel wajib diisi.' });
    }

    const generatedSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const articleDate = date || new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date());

    const { data, error } = await supabase
      .from('articles')
      .insert([
        {
          title,
          slug: generatedSlug,
          category: category || 'Sosial',
          date: articleDate,
          description,
          content,
          image: image || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=800&auto=format&fit=crop',
          author: author || 'Tim Riset Salimna',
          read_time: read_time || '5 mnt',
          is_published: 1,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data });
  } catch (error: any) {
    console.error('Error creating article in Supabase:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT update article
articlesRouter.put('/:id', async (req: Request, res: Response) => {
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
      is_published,
    } = req.body;

    const updatePayload: Record<string, any> = {};

    if (title !== undefined) updatePayload.title = title;
    if (slug !== undefined) updatePayload.slug = slug;
    if (category !== undefined) updatePayload.category = category;
    if (date !== undefined) updatePayload.date = date;
    if (description !== undefined) updatePayload.description = description;
    if (content !== undefined) updatePayload.content = content;
    if (image !== undefined) updatePayload.image = image;
    if (author !== undefined) updatePayload.author = author;
    if (read_time !== undefined) updatePayload.read_time = read_time;
    if (is_published !== undefined) updatePayload.is_published = is_published ? 1 : 0;

    const { data, error } = await supabase
      .from('articles')
      .update(updatePayload)
      .eq('id', Number(id))
      .select()
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ success: false, error: 'Artikel tidak ditemukan' });
    }

    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Error updating article in Supabase:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE article
articlesRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', Number(id));

    if (error) throw error;

    res.json({ success: true, message: 'Artikel berhasil dihapus' });
  } catch (error: any) {
    console.error('Error deleting article from Supabase:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
