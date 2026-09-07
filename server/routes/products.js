import express from 'express';
import jwt from 'jsonwebtoken';
import db from '../db.js';

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

export default router;
