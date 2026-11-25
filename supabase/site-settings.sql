-- ==============================================================================
-- SALIMNA PLATFORM - TABEL PENGATURAN TAMPILAN (SITE SETTINGS)
-- ==============================================================================
-- Jalankan file ini di Supabase SQL Editor agar foto latar hero dapat disimpan.
-- Setelah dijalankan, buka /admin -> tab "Tampilan Hero" untuk mengunggah foto.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Server API memakai service role (bypass RLS). Tidak ada akses publik langsung.
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Foto publik dapat ditampilkan di situs; unggahan dan penghapusan dilakukan API server
-- menggunakan service role setelah memverifikasi sesi admin.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'salimna-media',
  'salimna-media',
  true,
  3145728,
  ARRAY['image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Muat ulang cache skema PostgREST agar tabel langsung dikenali API.
NOTIFY pgrst, 'reload schema';
