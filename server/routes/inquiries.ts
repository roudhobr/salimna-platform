import { Router, Request, Response } from 'express';
import { supabase } from '../supabase.js';

export const inquiriesRouter = Router();

// GET all inquiries
inquiriesRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('inquiries')
      .select('*')
      .order('id', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data: data || [] });
  } catch (error: any) {
    console.error('Error fetching inquiries from Supabase:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST inquiry
inquiriesRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, error: 'Nama, email, dan pesan wajib diisi.' });
    }

    const { data, error } = await supabase
      .from('inquiries')
      .insert([{ name, email, message }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Pesan Anda berhasil terkirim!',
      data,
    });
  } catch (error: any) {
    console.error('Error submitting inquiry to Supabase:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
