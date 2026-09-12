import { Router, Request, Response } from 'express';
import { db } from '../db.js';

export const inquiriesRouter = Router();

// GET all inquiries
inquiriesRouter.get('/', (_req: Request, res: Response) => {
  try {
    const inquiries = db.prepare('SELECT * FROM inquiries ORDER BY id DESC').all();
    res.json({ success: true, data: inquiries });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST inquiry
inquiriesRouter.post('/', (req: Request, res: Response) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, error: 'Nama, email, dan pesan wajib diisi.' });
    }

    const stmt = db.prepare('INSERT INTO inquiries (name, email, message) VALUES (?, ?, ?)');
    const result = stmt.run(name, email, message);

    const created = db.prepare('SELECT * FROM inquiries WHERE id = ?').get(Number(result.lastInsertRowid));
    res.status(201).json({ success: true, message: 'Pesan Anda berhasil terkirim!', data: created });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
