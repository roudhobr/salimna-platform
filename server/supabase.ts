import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseKey) &&
    !supabaseUrl.includes('your-project-id') &&
    !supabaseKey.includes('your-server-only-service-role-key')
  );
};

if (!isSupabaseConfigured()) {
  console.warn(`
  ⚠️  [Pemberitahuan Supabase]
  SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi.
  Atur kredensial server-only tersebut untuk mengaktifkan API.
  `);
}

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
