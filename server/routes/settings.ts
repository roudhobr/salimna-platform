import { randomUUID } from 'node:crypto';
import { Router, Request, Response } from 'express';
import { supabase } from '../supabase.js';
import { requireAdminAuth } from '../admin.js';

export const settingsRouter = Router();

const HERO_KEYS = ['hero_image_1', 'hero_image_2', 'hero_image_3'] as const;
const PUBLIC_KEYS = ['hero_image', ...HERO_KEYS];
const MAX_IMAGE_LENGTH = 3_500_000;
const HERO_BUCKET = 'salimna-media';
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

const isValidImageValue = (value: string) =>
  !value ||
  /^data:image\/(?:jpeg|png);base64,/i.test(value) ||
  /^https?:\/\//i.test(value) ||
  value.startsWith('/');

const getHeroStoragePath = (value: string): string | null => {
  try {
    const url = new URL(value);
    const supabaseUrl = new URL(process.env.SUPABASE_URL || '');
    const prefix = `/storage/v1/object/public/${HERO_BUCKET}/`;

    if (url.origin !== supabaseUrl.origin || !url.pathname.startsWith(prefix)) return null;
    return decodeURIComponent(url.pathname.slice(prefix.length));
  } catch {
    return null;
  }
};

settingsRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('key,value')
      .in('key', PUBLIC_KEYS);

    if (error) throw error;

    const settings = Object.fromEntries(
      (data || []).map((row: any) => [row.key, row.value ?? ''])
    );

    res.json({ success: true, data: settings });
  } catch (error: any) {
    // Tabel site_settings mungkin belum dibuat. Situs tetap berjalan dengan latar bawaan.
    console.warn('Settings belum tersedia:', error.message);
    res.json({ success: true, data: {} });
  }
});

settingsRouter.put('/', requireAdminAuth, async (req: Request, res: Response) => {
  const uploadedPaths: string[] = [];

  try {
    const rows: { key: string; value: string; updated_at: string }[] = [];
    const uploads: {
      row: { key: string; value: string; updated_at: string };
      buffer: Buffer;
      contentType: string;
      extension: string;
    }[] = [];
    const now = new Date().toISOString();

    for (const key of HERO_KEYS) {
      const value = req.body?.[key];
      if (value === undefined) continue;

      if (typeof value !== 'string') {
        return res.status(400).json({ success: false, error: `Data ${key} tidak valid.` });
      }

      if (value.length > MAX_IMAGE_LENGTH) {
        return res.status(413).json({
          success: false,
          error: 'Ukuran foto terlalu besar. Gunakan foto di bawah 3 MB per slide.',
        });
      }

      if (!isValidImageValue(value)) {
        return res.status(400).json({ success: false, error: `Format gambar ${key} tidak dikenali.` });
      }

      const row = { key, value, updated_at: now };
      rows.push(row);

      if (/^data:/i.test(value)) {
        const match = value.match(/^data:(image\/(?:jpeg|png));base64,([A-Za-z0-9+/]+={0,2})$/i);
        if (!match) {
          return res.status(400).json({ success: false, error: `Data foto ${key} tidak valid.` });
        }

        const contentType = match[1].toLowerCase();
        const buffer = Buffer.from(match[2], 'base64');
        if (buffer.length > MAX_IMAGE_BYTES) {
          return res.status(413).json({
            success: false,
            error: 'Ukuran foto terlalu besar. Gunakan foto di bawah 3 MB per slide.',
          });
        }

        const isPng = contentType === 'image/png';
        const validSignature = isPng
          ? buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
          : buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
        if (!validSignature) {
          return res.status(400).json({ success: false, error: `Isi foto ${key} tidak valid.` });
        }

        uploads.push({
          row,
          buffer,
          contentType,
          extension: isPng ? 'png' : 'jpg',
        });
      }
    }

    if (rows.length === 0) {
      return res.status(400).json({ success: false, error: 'Tidak ada data latar hero yang dikirim.' });
    }

    const { data: previousSettings, error: previousSettingsError } = await supabase
      .from('site_settings')
      .select('key,value')
      .in('key', rows.map((row) => row.key));
    if (previousSettingsError) throw previousSettingsError;

    for (const upload of uploads) {
      const path = `hero/${upload.row.key}/${randomUUID()}.${upload.extension}`;
      const { error: uploadError } = await supabase.storage
        .from(HERO_BUCKET)
        .upload(path, upload.buffer, {
          cacheControl: '31536000',
          contentType: upload.contentType,
          upsert: false,
        });
      if (uploadError) throw uploadError;

      uploadedPaths.push(path);
      upload.row.value = supabase.storage.from(HERO_BUCKET).getPublicUrl(path).data.publicUrl;
    }

    const { error } = await supabase
      .from('site_settings')
      .upsert(rows, { onConflict: 'key' });

    if (error) throw error;

    const activePaths = new Set(
      rows.flatMap((row) => {
        const path = getHeroStoragePath(row.value);
        return path ? [path] : [];
      })
    );
    const previousPaths = (previousSettings || []).flatMap((setting: { value: string | null }) => {
      const path = getHeroStoragePath(setting.value || '');
      return path && !activePaths.has(path) ? [path] : [];
    });

    if (previousPaths.length > 0) {
      try {
        const { error: removeError } = await supabase.storage.from(HERO_BUCKET).remove(previousPaths);
        if (removeError) console.error('Gagal menghapus foto hero lama dari Supabase Storage:', removeError);
      } catch (removeError) {
        console.error('Gagal menghapus foto hero lama dari Supabase Storage:', removeError);
      }
    }

    res.json({
      success: true,
      data: Object.fromEntries(rows.map((row) => [row.key, row.value])),
    });
  } catch (error: any) {
    if (uploadedPaths.length > 0) {
      try {
        const { error: cleanupError } = await supabase.storage.from(HERO_BUCKET).remove(uploadedPaths);
        if (cleanupError) console.error('Gagal membersihkan unggahan hero yang batal:', cleanupError);
      } catch (cleanupError) {
        console.error('Gagal membersihkan unggahan hero yang batal:', cleanupError);
      }
    }

    console.error('Error menyimpan pengaturan situs:', error);
    res.status(500).json({
      success: false,
      error: `Gagal menyimpan latar hero ke Supabase. Pastikan tabel site_settings dan bucket ${HERO_BUCKET} sudah dibuat.`,
    });
  }
});
