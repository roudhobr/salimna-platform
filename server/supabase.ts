import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseKey) &&
    !supabaseUrl.includes('your-project-id') &&
    !supabaseKey.includes('your-anon-key')
  );
};

if (!isSupabaseConfigured()) {
  console.warn(`
  ⚠️  [Pemberitahuan Supabase]
  Kredensial SUPABASE_URL atau SUPABASE_ANON_KEY belum diatur di file .env!
  Harap masukkan URL dan Key proyek Supabase Anda pada file .env untuk mengaktifkan database cloud.
  `);
}

// Inisialisasi Supabase client
// Jika env belum diset saat dev, berikan dummy fallback URL agar server tetap bisa boot dan memberikan pesan error yang jelas pada route
export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
