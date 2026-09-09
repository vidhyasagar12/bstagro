import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb } from './db.js';
import { seedDb } from './seed.js';

import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import customerRoutes from './routes/customers.js';
import orderRoutes from './routes/orders.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS & Body Parsing (10mb limit for image uploads)
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialize Database
try {
  initDb();
} catch (err) {
  console.error('❌ Error initializing database:', err);
}

// API Healthcheck
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'BST Agro & Dairy Express API Server Running',
    timestamp: new Date().toISOString()
  });
});

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);

import fs from 'fs';

// Serve uploaded product images (Render persistent storage or local public/uploads)
const uploadsPath = process.env.DATA_DIR 
  ? path.join(process.env.DATA_DIR, 'uploads')
  : path.join(__dirname, '../public/uploads');

if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

app.use('/uploads', express.static(uploadsPath));

// Serve static build assets (Vite React app) in production
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Fallback all non-API routes to index.html for SPA client-side routing
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`🚀 BST Agro & Dairy Production Express Server running on http://localhost:${PORT}`);
});
