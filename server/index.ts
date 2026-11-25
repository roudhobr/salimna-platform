import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isSupabaseConfigured, supabase } from './supabase.js';
import { productsRouter } from './routes/products.js';
import { articlesRouter } from './routes/articles.js';
import { ordersRouter } from './routes/orders.js';
import { inquiriesRouter } from './routes/inquiries.js';
import { statsRouter } from './routes/stats.js';
import { settingsRouter } from './routes/settings.js';
import { receiptsRouter } from './routes/receipts.js';
import { adminRouter } from './admin.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_DIST_DIRECTORY = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
const shouldServeClient = process.env.SERVE_CLIENT === 'true';

if (shouldServeClient && !existsSync(path.join(CLIENT_DIST_DIRECTORY, 'index.html'))) {
  throw new Error('Frontend build is missing. Run "npm run build" before starting the cPanel app.');
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// API Health Check
app.get('/api/health', async (_req, res) => {
  const configured = isSupabaseConfigured();
  let dbStatus = configured ? 'connected' : 'unconfigured';
  let dbError: string | null = null;

  if (configured) {
    try {
      const { error } = await supabase.from('products').select('id', { count: 'exact', head: true });
      if (error) {
        dbStatus = 'connection_error';
        dbError = error.message;
      } else {
        dbStatus = 'active';
      }
    } catch (err: any) {
      dbStatus = 'connection_error';
      dbError = err.message;
    }
  }

  res.json({
    status: 'healthy',
    message: 'Salimna Platform Backend API is running smoothly',
    database: {
      provider: 'Supabase (PostgreSQL Cloud)',
      configured,
      status: dbStatus,
      error: dbError,
    },
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/products', productsRouter);
app.use('/api/articles', articlesRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/receipts', receiptsRouter);
app.use('/api/inquiries', inquiriesRouter);
app.use('/api/stats', statsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/admin', adminRouter);

if (shouldServeClient) {
  app.use(express.static(CLIENT_DIST_DIRECTORY));
}

// Global 404 handler for API routes
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, error: 'Endpoint API tidak ditemukan' });
  }
  if (shouldServeClient && req.method === 'GET') {
    return res.sendFile(path.join(CLIENT_DIST_DIRECTORY, 'index.html'));
  }
  res.status(404).send('Not Found');
});

export { app };

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    const configured = isSupabaseConfigured();
    console.log(`
    Salimna Full Stack Backend Server Ready!
    Port     : http://localhost:${PORT}
    Database : Supabase (PostgreSQL Cloud) [${configured ? 'Configured' : 'Credentials Pending'}]
    Health   : http://localhost:${PORT}/api/health
    `);
  });
}
