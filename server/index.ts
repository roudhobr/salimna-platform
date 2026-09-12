import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './db.js';
import { productsRouter } from './routes/products.js';
import { articlesRouter } from './routes/articles.js';
import { ordersRouter } from './routes/orders.js';
import { inquiriesRouter } from './routes/inquiries.js';
import { statsRouter } from './routes/stats.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize SQLite database and tables
initDatabase();

// Middleware
app.use(cors());
app.use(express.json());

// API Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    message: 'Salimna Platform Backend API is running smoothly',
    database: 'SQLite (node:sqlite native)',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/products', productsRouter);
app.use('/api/articles', articlesRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/inquiries', inquiriesRouter);
app.use('/api/stats', statsRouter);

// Global 404 handler for API routes
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, error: 'Endpoint API tidak ditemukan' });
  }
  res.status(404).send('Not Found');
});

app.listen(PORT, () => {
  console.log(`
  🚀 ===============================================
     Salimna Full Stack Backend Server Ready!
     Port     : http://localhost:${PORT}
     Database : SQLite (server/data/salimna.db)
     Health   : http://localhost:${PORT}/api/health
  ===============================================
  `);
});
