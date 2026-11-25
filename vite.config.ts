import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const supabaseUrl = env.VITE_SUPABASE_URL?.trim();
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY?.trim();
  const hasPlaceholderValue = (value: string) =>
    /your-project-id|your-anon-key|placeholder/i.test(value);

  if (
    !supabaseUrl ||
    !supabaseAnonKey ||
    hasPlaceholderValue(supabaseUrl) ||
    hasPlaceholderValue(supabaseAnonKey)
  ) {
    throw new Error(
      'Build dibatalkan: isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di environment build.'
    );
  }

  return {
    plugins: [react(), tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'react-vendor';
            if (id.includes('node_modules/motion')) return 'motion-vendor';
            if (id.includes('node_modules/lucide-react')) return 'icons';
            if (id.includes('node_modules/react-router')) return 'router-vendor';
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
        },
      },
    },
  };
});
