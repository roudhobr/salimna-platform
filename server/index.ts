import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { isSupabaseConfigured, supabase } from './supabase.js';
import { productsRouter } from './routes/products.js';
import { articlesRouter } from './routes/articles.js';
import { ordersRouter } from './routes/orders.js';
import { inquiriesRouter } from './routes/inquiries.js';
import { statsRouter } from './routes/stats.js';
import { adminRouter } from './admin.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

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
app.use('/api/inquiries', inquiriesRouter);
app.use('/api/stats', statsRouter);
app.use('/api/admin', adminRouter);

// Global 404 handler for API routes
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, error: 'Endpoint API tidak ditemukan' });
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
