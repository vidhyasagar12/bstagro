import express from 'express';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'bst-agro-secret-key-2026';

// Get All Products (Evaluates Customer Specific Custom Pricing Server-Side)
router.get('/', (req, res) => {
  const products = db.prepare('SELECT * FROM products').all();

  // Convert SQLite integers (1/0) back to boolean flags
  const formattedProducts = products.map(p => ({
    ...p,
    inStock: Boolean(p.inStock),
    isFlagship: Boolean(p.isFlagship),
    isOwnBrand: p.brandId === 'bst',
    imageUrl: p.image
  }));

  // Check Authorization Header for Customer JWT
  let customerId = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded && decoded.id) {
        customerId = decoded.id;
      }
    } catch (err) {
      // Invalid/expired token - proceed as anonymous
    }
  }

  // If authenticated customer, attach their custom prices if configured
  if (customerId) {
    const customPrices = db.prepare('SELECT productId, customPrice FROM custom_prices WHERE customerId = ?').all(customerId);
    const priceMap = {};
    customPrices.forEach(cp => {
      priceMap[cp.productId] = cp.customPrice;
    });

    const evaluatedProducts = formattedProducts.map(p => {
      if (priceMap[p.id] !== undefined) {
        return {
          ...p,
          price: Math.max(0, priceMap[p.id]),
          hasCustomPrice: true
        };
      }
      return p;
    });

    return res.json(evaluatedProducts);
  }

  return res.json(formattedProducts);
});

// Supabase DB Sync Helper
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

async function syncSupabase(table, method, body, query = '') {
  if (!supabaseUrl || !supabaseKey) return;
  try {
    const url = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/${table}${query}`;
    await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apiKey': supabaseKey,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=minimal'
      },
      body: body ? JSON.stringify(body) : undefined
    });
  } catch (err) {
    console.warn(`⚠️ Supabase sync warning (${table}):`, err.message);
  }
}

// Admin: Create New Product
router.post('/', (req, res) => {
  const { name, brand, brandId, category, price, packSize, image, description, inStock, isFlagship } = req.body;

  if (!name || !brand || price === undefined) {
    return res.status(400).json({ error: 'Product name, company/brand name, and price are required.' });
  }

  const id = req.body.id || `prod-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const cleanName = (name || '').trim();
  const cleanBrand = (brand || '').trim();
  const cleanCategory = (category || 'General').trim();
  const cleanBrandId = (brandId || cleanBrand.toLowerCase().replace(/[^a-z0-9]/g, '')).substring(0, 30);
  const cleanPrice = Math.max(0, parseFloat(price) || 0);

  const newProduct = {
    id,
    name: cleanName,
    brand: cleanBrand,
    brandId: cleanBrandId,
    category: cleanCategory,
    price: cleanPrice,
    packSize: packSize || '',
    image: image || '',
    description: description || '',
    rating: 4.8,
    reviews: 45,
    inStock: inStock !== undefined ? (inStock ? 1 : 0) : 1,
    isFlagship: isFlagship ? 1 : 0
  };

  try {
    db.prepare(`
      INSERT INTO products (id, name, brand, brandId, category, price, packSize, image, description, rating, reviews, inStock, isFlagship)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      cleanName,
      cleanBrand,
      cleanBrandId,
      cleanCategory,
      cleanPrice,
      packSize || '',
      image || '',
      description || '',
      4.8,
      45,
      inStock !== undefined ? (inStock ? 1 : 0) : 1,
      isFlagship ? 1 : 0
    );

    // Sync to Supabase Postgres Database
    syncSupabase('products', 'POST', newProduct);

    return res.status(201).json({ success: true, ...newProduct, imageUrl: image || '' });
  } catch (err) {
    console.error('Error creating product:', err);
    return res.status(500).json({ error: 'Failed to create product.' });
  }
});

// Admin: Update Existing Product
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, brand, brandId, category, price, packSize, image, description, inStock, isFlagship } = req.body;

  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Product not found.' });
  }

  try {
    const cleanBrandId = brandId || (brand ? brand.toLowerCase().replace(/[^a-z0-9]/g, '') : existing.brandId);
    const cleanPrice = price !== undefined ? Math.max(0, parseFloat(price) || 0) : existing.price;

    const updatedData = {
      id,
      name: name || existing.name,
      brand: brand || existing.brand,
      brandId: cleanBrandId,
      category: category || existing.category,
      price: cleanPrice,
      packSize: packSize !== undefined ? packSize : existing.packSize,
      image: image !== undefined ? image : existing.image,
      description: description !== undefined ? description : existing.description,
      inStock: inStock !== undefined ? (inStock ? 1 : 0) : existing.inStock,
      isFlagship: isFlagship !== undefined ? (isFlagship ? 1 : 0) : existing.isFlagship
    };

    db.prepare(`
      UPDATE products SET
        name = ?, brand = ?, brandId = ?, category = ?, price = ?,
        packSize = ?, image = ?, description = ?, inStock = ?, isFlagship = ?
      WHERE id = ?
    `).run(
      updatedData.name,
      updatedData.brand,
      updatedData.brandId,
      updatedData.category,
      updatedData.price,
      updatedData.packSize,
      updatedData.image,
      updatedData.description,
      updatedData.inStock,
      updatedData.isFlagship,
      id
    );

    // Sync to Supabase Postgres Database
    syncSupabase('products', 'POST', updatedData);

    return res.json({ success: true, ...updatedData });
  } catch (err) {
    console.error('Error updating product:', err);
    return res.status(500).json({ error: 'Failed to update product.' });
  }
});

// Admin Update Product Base Catalog Price
router.put('/:id/base-price', (req, res) => {
  const { id } = req.params;
  const { price } = req.body;

  if (price === undefined || isNaN(price)) {
    return res.status(400).json({ error: 'Valid price is required.' });
  }

  const cleanPrice = Math.max(0, parseFloat(price));

  const result = db.prepare('UPDATE products SET price = ? WHERE id = ?').run(cleanPrice, id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Product not found.' });
  }

  return res.json({ success: true, id, price: cleanPrice });
});

// Admin: Delete Product
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  try {
    // Also remove any custom prices associated with this product
    db.prepare('DELETE FROM custom_prices WHERE productId = ?').run(id);
    const result = db.prepare('DELETE FROM products WHERE id = ?').run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    return res.json({ success: true, id });
  } catch (err) {
    console.error('Error deleting product:', err);
    return res.status(500).json({ error: 'Failed to delete product.' });
  }
});

// Admin: Upload Product Image (Supabase Storage Option 1 / Local Fallback)
router.post('/upload-image', async (req, res) => {
  const { imageData, filename } = req.body;

  if (!imageData) {
    return res.status(400).json({ error: 'Image data is required.' });
  }

  try {
    let ext = 'png';
    let mimeType = 'image/png';
    let base64Content = imageData;

    if (imageData.startsWith('data:image/')) {
      const match = imageData.match(/^data:image\/(\w+);base64,/);
      if (match) {
        ext = match[1] === 'jpeg' ? 'jpg' : match[1];
        mimeType = `image/${match[1]}`;
        base64Content = imageData.replace(/^data:image\/\w+;base64,/, '');
      }
    }

    const uniqueName = `product-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    // Option 1: Supabase Cloud Storage (1 GB Free Tier)
    if (supabaseUrl && supabaseKey) {
      try {
        const imageBuffer = Buffer.from(base64Content, 'base64');
        const uploadUrl = `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/product-images/${uniqueName}`;
        
        const response = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apiKey': supabaseKey,
            'Content-Type': mimeType,
            'x-upsert': 'true'
          },
          body: imageBuffer
        });

        if (response.ok) {
          const publicUrl = `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/product-images/${uniqueName}`;
          console.log('✅ Uploaded image to Supabase Storage (Option 1):', publicUrl);
          return res.json({ success: true, imageUrl: publicUrl });
        } else {
          const errText = await response.text();
          console.warn('⚠️ Supabase Storage upload error, falling back to local/base64:', errText);
        }
      } catch (supabaseErr) {
        console.warn('⚠️ Supabase Storage exception:', supabaseErr.message);
      }
    }

    // Local Disk Storage Fallback (npm run dev)
    try {
      const uploadsDir = process.env.DATA_DIR 
        ? path.join(process.env.DATA_DIR, 'uploads')
        : path.resolve(__dirname, '../../public/uploads');

      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const filePath = path.join(uploadsDir, uniqueName);
      fs.writeFileSync(filePath, base64Content, 'base64');

      const imageUrl = `/uploads/${uniqueName}`;
      return res.json({ success: true, imageUrl });
    } catch (fsErr) {
      console.warn('⚠️ Local disk write unavailable. Using base64 Data URL fallback:', fsErr.message);
      return res.json({ success: true, imageUrl: imageData });
    }
  } catch (err) {
    console.error('Error uploading image:', err);
    return res.json({ success: true, imageUrl: imageData });
  }
});

export default router;
