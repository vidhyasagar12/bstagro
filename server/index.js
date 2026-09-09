import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { initDb } from './db.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import customerRoutes from './routes/customers.js';
import orderRoutes from './routes/orders.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ─── INITIALIZE LOCAL SQLITE (fallback, non-fatal) ───────────────────────────
try {
  initDb();
} catch (err) {
  console.warn('⚠️ SQLite init warning (non-fatal on Supabase-only deployments):', err.message);
}

// ─── SERVE UPLOADED IMAGES (local dev / Render persistent disk) ──────────────
const uploadsPath = process.env.DATA_DIR
  ? path.join(process.env.DATA_DIR, 'uploads')
  : path.join(__dirname, '../public/uploads');

if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));

// ─── API HEALTHCHECK ──────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'BST Agro & Dairy Express API Server Running',
    timestamp: new Date().toISOString(),
    supabase: process.env.SUPABASE_URL ? '✅ configured' : '❌ not configured',
    node: process.version
  });
});

// ─── API ROUTES ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);

// ─── ROOT WELCOME ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'BST Agro & Dairy Wholesale Express API',
    documentation: 'API endpoints available under /api/*',
    health: '/api/health'
  });
});

// ─── 404 HANDLER (non-API, non-uploads routes) ───────────────────────────────
app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
  res.status(404).json({ error: 'Endpoint not found. Access the API via /api/* endpoints.' });
});

// ─── GLOBAL ERROR HANDLER (must have 4 params for Express to treat as error middleware) ──
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('❌ Express Global Error:', err.message, err.stack);
  res.status(500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// ─── START SERVER ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 BST Agro & Dairy Production Express Server running on port ${PORT}`);
});
