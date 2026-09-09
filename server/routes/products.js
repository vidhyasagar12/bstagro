import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { supabase, isSupabaseConfigured, resilientSupabaseInsert } from '../supabaseClient.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'bst-agro-secret-key-2026';

// ─── GET ALL PRODUCTS ────────────────────────────────────────────────────────
// Returns products from Supabase. Evaluates custom prices if customer JWT provided.
router.get('/', async (req, res, next) => {
  if (!isSupabaseConfigured) {
    return res.status(503).json({ error: 'Database not configured. Please set Supabase environment variables on Render.' });
  }

  try {
    const { data, error } = await supabase.from('products').select('*');
    if (error) {
      console.error('Supabase GET /products error:', error);
      return res.status(400).json({ error: error.message, details: error.details || error.hint });
    }

    const formattedProducts = (data || []).map(p => {
      const bId = p.brandid || p.brandId || p.brand_id || (p.brand ? p.brand.toLowerCase().replace(/[^a-z0-9]/g, '') : 'gen');
      const img = p.image || p.imageUrl || p.image_url || '';
      const inStk = p.instock !== undefined ? p.instock : (p.inStock !== undefined ? p.inStock : (p.in_stock !== undefined ? p.in_stock : 1));
      const isFlag = p.isflagship !== undefined ? p.isflagship : (p.isFlagship !== undefined ? p.isFlagship : (p.is_flagship !== undefined ? p.is_flagship : 0));

      return {
        ...p,
        id: String(p.id),
        name: p.name,
        brand: p.brand,
        brandId: bId,
        category: p.category,
        price: parseFloat(p.price) || 0,
        packSize: p.packsize || p.packSize || p.pack_size || '',
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

    // Check Authorization Header for Customer JWT to apply custom prices
    let customerId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded && decoded.id) {
          customerId = decoded.id;
        }
      } catch {
        // Invalid/expired token — proceed as anonymous
      }
    }

    if (customerId) {
      const { data: cpData } = await supabase.from('custom_prices').select('*');
      const customPrices = (cpData || []).filter(cp => String(cp.customerid || cp.customerId || cp.customer_id) === String(customerId));

      const priceMap = {};
      customPrices.forEach(cp => {
        const pId = cp.productid || cp.productId || cp.product_id;
        const cPrice = cp.customprice !== undefined ? cp.customprice : (cp.customPrice !== undefined ? cp.customPrice : cp.custom_price);
        if (pId && cPrice !== undefined) {
          priceMap[pId] = parseFloat(cPrice) || 0;
        }
      });

      const evaluatedProducts = formattedProducts.map(p => {
        if (priceMap[p.id] !== undefined) {
          return { ...p, price: Math.max(0, priceMap[p.id]), hasCustomPrice: true };
        }
        return p;
      });

      return res.json(evaluatedProducts);
    }

    return res.json(formattedProducts);
  } catch (err) {
    next(err);
  }
});

// ─── CREATE NEW PRODUCT ──────────────────────────────────────────────────────
router.post('/', async (req, res, next) => {
  const { name, brand, brandId, category, price, packSize, image, description, inStock, isFlagship } = req.body;

  if (!name || !brand || price === undefined) {
    return res.status(400).json({ error: 'Product name, company/brand name, and price are required.' });
  }

  if (!isSupabaseConfigured) {
    return res.status(503).json({ error: 'Database not configured. Please set Supabase environment variables on Render.' });
  }

  try {
    const id = req.body.id || `prod-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const cleanName = (name || '').trim();
    const cleanBrand = (brand || '').trim();
    const cleanCategory = (category || 'General').trim();
    const cleanBrandId = (brandId || cleanBrand.toLowerCase().replace(/[^a-z0-9]/g, '')).substring(0, 30);
    const cleanPrice = Math.max(0, parseFloat(price) || 0);

    const lowerProduct = {
      id,
      name: cleanName,
      brand: cleanBrand,
      brandid: cleanBrandId,
      category: cleanCategory,
      price: cleanPrice,
      packsize: packSize || '',
      image: image || '',
      description: description || '',
      rating: 4.8,
      reviews: 45,
      instock: inStock !== undefined ? (inStock ? 1 : 0) : 1,
      isflagship: isFlagship ? 1 : 0
    };

    const snakeProduct = {
      id,
      name: cleanName,
      brand: cleanBrand,
      brand_id: cleanBrandId,
      category: cleanCategory,
      price: cleanPrice,
      pack_size: packSize || '',
      image: image || '',
      description: description || '',
      rating: 4.8,
      reviews: 45,
      in_stock: inStock !== undefined ? (inStock ? 1 : 0) : 1,
      is_flagship: isFlagship ? 1 : 0
    };

    const camelProduct = {
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

    const { error } = await resilientSupabaseInsert('products', [lowerProduct, snakeProduct, camelProduct]);

    if (error) {
      console.error('Supabase POST /products error:', error);
      return res.status(400).json({ error: `Supabase Error: ${error.message}` });
    }

    console.log('✅ Product saved to Supabase:', id);
    return res.status(201).json({
      success: true,
      id,
      name: cleanName,
      brand: cleanBrand,
      brandId: cleanBrandId,
      category: cleanCategory,
      price: cleanPrice,
      packSize: packSize || '',
      image: image || '',
      imageUrl: image || '',
      description: description || '',
      inStock: Boolean(inStock),
      isFlagship: Boolean(isFlagship)
    });
  } catch (err) {
    next(err);
  }
});

// ─── UPDATE BASE PRICE (must be before /:id to avoid route conflict) ─────────
router.put('/:id/base-price', async (req, res, next) => {
  const { id } = req.params;
  const { price } = req.body;

  if (price === undefined || isNaN(price)) {
    return res.status(400).json({ error: 'Valid price is required.' });
  }

  if (!isSupabaseConfigured) {
    return res.status(503).json({ error: 'Database not configured.' });
  }

  try {
    const cleanPrice = Math.max(0, parseFloat(price));
    const { error } = await supabase.from('products').update({ price: cleanPrice }).eq('id', id);
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    return res.json({ success: true, id, price: cleanPrice });
  } catch (err) {
    next(err);
  }
});

// ─── UPDATE EXISTING PRODUCT ─────────────────────────────────────────────────
router.put('/:id', async (req, res, next) => {
  const { id } = req.params;
  const { name, brand, brandId, category, price, packSize, image, description, inStock, isFlagship } = req.body;

  if (!isSupabaseConfigured) {
    return res.status(503).json({ error: 'Database not configured.' });
  }

  try {
    const { data: existing, error: findErr } = await supabase.from('products').select('*').eq('id', id).single();
    if (findErr || !existing) {
      return res.status(404).json({ error: 'Product not found in Supabase database.' });
    }

    const cleanBrandId = brandId || (brand ? brand.toLowerCase().replace(/[^a-z0-9]/g, '') : (existing.brandid || existing.brandId || existing.brand_id));
    const cleanPrice = price !== undefined ? Math.max(0, parseFloat(price) || 0) : parseFloat(existing.price);

    const lowerProduct = {
      id,
      name: name || existing.name,
      brand: brand || existing.brand,
      brandid: cleanBrandId,
      category: category || existing.category,
      price: cleanPrice,
      packsize: packSize !== undefined ? packSize : (existing.packsize || existing.packSize || existing.pack_size || ''),
      image: image !== undefined ? image : (existing.image || ''),
      description: description !== undefined ? description : (existing.description || ''),
      instock: inStock !== undefined ? (inStock ? 1 : 0) : (existing.instock !== undefined ? existing.instock : 1),
      isflagship: isFlagship !== undefined ? (isFlagship ? 1 : 0) : (existing.isflagship !== undefined ? existing.isflagship : 0)
    };

    const snakeProduct = {
      id,
      name: name || existing.name,
      brand: brand || existing.brand,
      brand_id: cleanBrandId,
      category: category || existing.category,
      price: cleanPrice,
      pack_size: packSize !== undefined ? packSize : (existing.packsize || existing.packSize || existing.pack_size || ''),
      image: image !== undefined ? image : (existing.image || ''),
      description: description !== undefined ? description : (existing.description || ''),
      in_stock: inStock !== undefined ? (inStock ? 1 : 0) : (existing.instock !== undefined ? existing.instock : 1),
      is_flagship: isFlagship !== undefined ? (isFlagship ? 1 : 0) : (existing.isflagship !== undefined ? existing.isflagship : 0)
    };

    const camelProduct = {
      id,
      name: name || existing.name,
      brand: brand || existing.brand,
      brandId: cleanBrandId,
      category: category || existing.category,
      price: cleanPrice,
      packSize: packSize !== undefined ? packSize : (existing.packsize || existing.packSize || existing.pack_size || ''),
      image: image !== undefined ? image : (existing.image || ''),
      description: description !== undefined ? description : (existing.description || ''),
      inStock: inStock !== undefined ? (inStock ? 1 : 0) : (existing.instock !== undefined ? existing.instock : 1),
      isFlagship: isFlagship !== undefined ? (isFlagship ? 1 : 0) : (existing.isflagship !== undefined ? existing.isflagship : 0)
    };

    const { error } = await resilientSupabaseInsert('products', [lowerProduct, snakeProduct, camelProduct]);

    if (error) {
      console.error('Supabase PUT /products error:', error);
      return res.status(400).json({ error: `Supabase Error: ${error.message}` });
    }

    return res.json({
      success: true,
      id,
      name: lowerProduct.name,
      brand: lowerProduct.brand,
      brandId: cleanBrandId,
      category: lowerProduct.category,
      price: cleanPrice,
      packSize: lowerProduct.packsize,
      image: lowerProduct.image,
      imageUrl: lowerProduct.image,
      description: lowerProduct.description,
      inStock: Boolean(lowerProduct.instock),
      isFlagship: Boolean(lowerProduct.isflagship)
    });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE PRODUCT ───────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const cleanId = (id || '').trim();

  if (!cleanId) {
    return res.status(400).json({ error: 'Product ID is required.' });
  }

  if (!isSupabaseConfigured) {
    return res.status(503).json({ error: 'Database not configured on server. Cannot delete product.' });
  }

  try {
    // 1. Delete associated custom prices across all column naming variants
    await supabase.from('custom_prices').delete().eq('productid', cleanId);
    await supabase.from('custom_prices').delete().eq('productId', cleanId);
    await supabase.from('custom_prices').delete().eq('product_id', cleanId);

    // 2. Delete the product itself
    const prodResult = await supabase.from('products').delete().eq('id', cleanId);

    if (prodResult.error) {
      console.error('❌ Supabase product delete error:', prodResult.error);
      return res.status(400).json({ error: `Delete failed: ${prodResult.error.message}` });
    }

    console.log('✅ Product deleted from Supabase:', cleanId);
    return res.status(200).json({ success: true, id: cleanId });
  } catch (err) {
    console.error('❌ Unexpected delete exception:', err.message, err.stack);
    return res.status(500).json({ error: `Server error during delete: ${err.message}` });
  }
});

// ─── UPLOAD PRODUCT IMAGE (Base64 → Supabase Storage) ────────────────────────
router.post('/upload-image', async (req, res, next) => {
  const { imageData, filename } = req.body;

  if (!imageData) {
    return res.status(400).json({ error: 'Image data is required.' });
  }

  if (!isSupabaseConfigured) {
    return res.status(503).json({ error: 'Supabase credentials not configured.' });
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
    const imageBuffer = Buffer.from(base64Content, 'base64');

    const { data: storageData, error: storageErr } = await supabase.storage
      .from('product-images')
      .upload(`products/${uniqueName}`, imageBuffer, {
        contentType: mimeType,
        upsert: true
      });

    if (storageErr) {
      console.error('⚠️ Supabase Storage Upload Error:', storageErr);
      return res.status(400).json({ error: `Image upload failed: ${storageErr.message}` });
    }

    const { data: publicUrlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(`products/${uniqueName}`);

    const publicUrl = publicUrlData.publicUrl;
    console.log('✅ Image uploaded to Supabase Storage:', publicUrl);
    return res.json({ success: true, imageUrl: publicUrl });
  } catch (err) {
    next(err);
  }
});

export default router;
