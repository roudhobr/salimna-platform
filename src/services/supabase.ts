import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

const hasPlaceholderValue = (value: string) =>
  /your-project-id|your-anon-key|placeholder/i.test(value);

if (
  !supabaseUrl ||
  !supabaseAnonKey ||
  hasPlaceholderValue(supabaseUrl) ||
  hasPlaceholderValue(supabaseAnonKey)
) {
  throw new Error(
    'Supabase frontend belum dikonfigurasi. Set VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY sebelum build.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
