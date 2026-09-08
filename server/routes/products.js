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

// Admin: Create New Product
router.post('/', (req, res) => {
  const { name, brand, brandId, category, price, packSize, image, description, inStock, isFlagship } = req.body;

  if (!name || !brand || price === undefined) {
    return res.status(400).json({ error: 'Product name, company/brand name, and price are required.' });
  }

  const id = `prod-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const cleanBrandId = (brandId || brand.toLowerCase().replace(/[^a-z0-9]/g, '')).substring(0, 30);
  const cleanPrice = Math.max(0, parseFloat(price) || 0);

  try {
    db.prepare(`
      INSERT INTO products (id, name, brand, brandId, category, price, packSize, image, description, rating, reviews, inStock, isFlagship)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      name,
      brand,
      cleanBrandId,
      category || 'General',
      cleanPrice,
      packSize || '',
      image || '',
      description || '',
      0,
      0,
      inStock !== undefined ? (inStock ? 1 : 0) : 1,
      isFlagship ? 1 : 0
    );

    return res.status(201).json({ success: true, id, name, brand, price: cleanPrice });
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

    db.prepare(`
      UPDATE products SET
        name = ?, brand = ?, brandId = ?, category = ?, price = ?,
        packSize = ?, image = ?, description = ?, inStock = ?, isFlagship = ?
      WHERE id = ?
    `).run(
      name || existing.name,
      brand || existing.brand,
      cleanBrandId,
      category || existing.category,
      cleanPrice,
      packSize !== undefined ? packSize : existing.packSize,
      image !== undefined ? image : existing.image,
      description !== undefined ? description : existing.description,
      inStock !== undefined ? (inStock ? 1 : 0) : existing.inStock,
      isFlagship !== undefined ? (isFlagship ? 1 : 0) : existing.isFlagship,
      id
    );

    return res.json({ success: true, id });
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

// Admin: Upload Product Image (Base64)
router.post('/upload-image', (req, res) => {
  const { imageData, filename } = req.body;

  if (!imageData) {
    return res.status(400).json({ error: 'Image data is required.' });
  }

  try {
    // Determine file extension from base64 header or filename
    let ext = 'png';
    let base64Content = imageData;

    if (imageData.startsWith('data:image/')) {
      const match = imageData.match(/^data:image\/(\w+);base64,/);
      if (match) {
        ext = match[1] === 'jpeg' ? 'jpg' : match[1];
        base64Content = imageData.replace(/^data:image\/\w+;base64,/, '');
      }
    }

    const uniqueName = `product-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
    const uploadsDir = process.env.DATA_DIR 
      ? path.join(process.env.DATA_DIR, 'uploads')
      : path.resolve(__dirname, '../../public/uploads');

    // Ensure uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, uniqueName);
    fs.writeFileSync(filePath, base64Content, 'base64');

    const imageUrl = `/uploads/${uniqueName}`;
    return res.json({ success: true, imageUrl });
  } catch (err) {
    console.error('Error uploading image:', err);
    return res.status(500).json({ error: 'Failed to upload image.' });
  }
});

export default router;
