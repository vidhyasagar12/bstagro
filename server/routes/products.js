import express from 'express';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import { supabase, isSupabaseConfigured } from '../supabaseClient.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'bst-agro-secret-key-2026';

// Get All Products (Primary: Supabase Cloud Postgres / Fallback: SQLite)
router.get('/', async (req, res) => {
  let products = [];

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('products').select('*');
      if (!error && Array.isArray(data) && data.length > 0) {
        products = data;
      } else {
        products = db.prepare('SELECT * FROM products').all();
      }
    } catch (err) {
      console.warn('Supabase DB fetch fallback to SQLite:', err.message);
      products = db.prepare('SELECT * FROM products').all();
    }
  } else {
    products = db.prepare('SELECT * FROM products').all();
  }

  // Convert flags and format product objects with robust camelCase & lowercase column mapping
  const formattedProducts = products.map(p => {
    const bId = p.brandId || p.brandid || (p.brand ? p.brand.toLowerCase().replace(/[^a-z0-9]/g, '') : 'gen');
    const img = p.image || p.imageUrl || '';
    const inStk = p.inStock !== undefined ? p.inStock : (p.instock !== undefined ? p.instock : 1);
    const isFlag = p.isFlagship !== undefined ? p.isFlagship : (p.isflagship !== undefined ? p.isflagship : 0);

    return {
      ...p,
      id: p.id,
      name: p.name,
      brand: p.brand,
      brandId: bId,
      category: p.category,
      price: parseFloat(p.price) || 0,
      packSize: p.packSize || p.packsize || '',
      image: img,
      imageUrl: img,
      description: p.description || '',
      rating: parseFloat(p.rating) || 4.8,
      reviews: parseInt(p.reviews) || 45,
      inStock: Boolean(inStk),
      isFlagship: Boolean(isFlag),
      isOwnBrand: bId === 'bst' || (p.brand && p.brand.toLowerCase().includes('bst'))
    };
  });

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
    let customPrices = [];
    if (isSupabaseConfigured) {
      const { data: cpData } = await supabase.from('custom_prices').select('productId, customPrice').eq('customerId', customerId);
      customPrices = cpData || db.prepare('SELECT productId, customPrice FROM custom_prices WHERE customerId = ?').all(customerId);
    } else {
      customPrices = db.prepare('SELECT productId, customPrice FROM custom_prices WHERE customerId = ?').all(customerId);
    }

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
router.post('/', async (req, res) => {
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
    // 1. Insert into SQLite (Local Backup)
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
      newProduct.inStock,
      newProduct.isFlagship
    );

    // 2. Insert into Supabase Cloud Postgres Database (Supports both lowercase and camelCase PostgreSQL schema)
    if (isSupabaseConfigured) {
      const sbProduct = {
        id,
        name: cleanName,
        brand: cleanBrand,
        brandid: cleanBrandId,
        brandId: cleanBrandId,
        category: cleanCategory,
        price: cleanPrice,
        packsize: packSize || '',
        packSize: packSize || '',
        image: image || '',
        description: description || '',
        rating: 4.8,
        reviews: 45,
        instock: newProduct.inStock,
        inStock: newProduct.inStock,
        isflagship: newProduct.isFlagship,
        isFlagship: newProduct.isFlagship
      };

      const { error: sbErr } = await supabase.from('products').upsert([sbProduct]);
      if (sbErr) {
        console.error('⚠️ Supabase Product Insert Error:', sbErr);
      } else {
        console.log('✅ Product saved directly to Supabase Postgres DB:', id);
      }
    }

    return res.status(201).json({ success: true, ...newProduct, imageUrl: image || '' });
  } catch (err) {
    console.error('Error creating product:', err);
    return res.status(500).json({ error: 'Failed to create product.' });
  }
});

// Admin: Update Existing Product
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, brand, brandId, category, price, packSize, image, description, inStock, isFlagship } = req.body;

  let existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!existing && isSupabaseConfigured) {
    const { data } = await supabase.from('products').select('*').eq('id', id).single();
    existing = data;
  }

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

    // Update SQLite
    try {
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
    } catch (e) {
      console.warn('SQLite update error:', e);
    }

    // Update Supabase
    if (isSupabaseConfigured) {
      await supabase.from('products').upsert([updatedData]);
    }

    return res.json({ success: true, ...updatedData });
  } catch (err) {
    console.error('Error updating product:', err);
    return res.status(500).json({ error: 'Failed to update product.' });
  }
});

// Admin Update Product Base Catalog Price
router.put('/:id/base-price', async (req, res) => {
  const { id } = req.params;
  const { price } = req.body;

  if (price === undefined || isNaN(price)) {
    return res.status(400).json({ error: 'Valid price is required.' });
  }

  const cleanPrice = Math.max(0, parseFloat(price));

  try {
    db.prepare('UPDATE products SET price = ? WHERE id = ?').run(cleanPrice, id);
    if (isSupabaseConfigured) {
      await supabase.from('products').update({ price: cleanPrice }).eq('id', id);
    }
    return res.json({ success: true, id, price: cleanPrice });
  } catch (err) {
    console.error('Error updating base price:', err);
    return res.status(500).json({ error: 'Failed to update price.' });
  }
});

// Admin: Delete Product
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    db.prepare('DELETE FROM custom_prices WHERE productId = ?').run(id);
    db.prepare('DELETE FROM products WHERE id = ?').run(id);

    if (isSupabaseConfigured) {
      await supabase.from('custom_prices').delete().eq('productId', id);
      await supabase.from('products').delete().eq('id', id);
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

    // Upload to Supabase Storage Bucket
    if (isSupabaseConfigured) {
      try {
        const imageBuffer = Buffer.from(base64Content, 'base64');
        const { data: storageData, error: storageErr } = await supabase.storage
          .from('product-images')
          .upload(`products/${uniqueName}`, imageBuffer, {
            contentType: mimeType,
            upsert: true
          });

        if (!storageErr) {
          const { data: publicUrlData } = supabase.storage
            .from('product-images')
            .getPublicUrl(`products/${uniqueName}`);

          const publicUrl = publicUrlData.publicUrl;
          console.log('✅ Image uploaded to Supabase Storage:', publicUrl);
          return res.json({ success: true, imageUrl: publicUrl });
        } else {
          console.error('⚠️ Supabase Storage Upload Error:', storageErr);
        }
      } catch (supabaseErr) {
        console.error('⚠️ Supabase Storage Exception:', supabaseErr);
      }
    }

    // Local Disk Storage Fallback
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
