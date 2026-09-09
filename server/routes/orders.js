import express from 'express';
import db from '../db.js';
import { supabase, isSupabaseConfigured } from '../supabaseClient.js';

const router = express.Router();

// Record New Wholesale Order Endpoint
router.post('/', async (req, res) => {
  const { customerId, shopName, ownerName, phone, address, totalAmount, items } = req.body;

  if (!shopName || !phone || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Shop Name, Phone, and Order Items are required.' });
  }

  const orderId = `ORD-${Date.now()}`;
  const cleanTotal = Math.max(0, parseFloat(totalAmount) || 0);
  const itemsJsonStr = JSON.stringify(items);

  const newOrder = {
    id: orderId,
    customerPhone: phone,
    items: itemsJsonStr,
    totalAmount: cleanTotal,
    status: 'Submitted',
    createdAt: new Date().toISOString()
  };

  try {
    db.prepare(`
      INSERT INTO orders (id, customerId, shopName, ownerName, phone, address, totalAmount, itemsJson, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Submitted')
    `).run(orderId, customerId || null, shopName, ownerName || '', phone, address || '', cleanTotal, itemsJsonStr);
  } catch (e) {
    console.warn('SQLite order insert warning:', e);
  }

  if (isSupabaseConfigured) {
    await supabase.from('orders').upsert([newOrder]);
  }

  const returnedOrder = {
    ...newOrder,
    shopName,
    ownerName,
    phone,
    address,
    items
  };

  return res.json({ success: true, order: returnedOrder });
});

// Admin Get Order History
router.get('/', async (req, res) => {
  let orders = [];

  if (isSupabaseConfigured) {
    try {
      const { data } = await supabase.from('orders').select('*').order('createdAt', { ascending: false });
      orders = data || db.prepare('SELECT * FROM orders ORDER BY createdAt DESC').all();
    } catch (err) {
      console.warn('Supabase orders fetch fallback to SQLite:', err.message);
      orders = db.prepare('SELECT * FROM orders ORDER BY createdAt DESC').all();
    }
  } else {
    orders = db.prepare('SELECT * FROM orders ORDER BY createdAt DESC').all();
  }

  const formattedOrders = orders.map(ord => {
    let items = [];
    try {
      items = typeof ord.items === 'string' ? JSON.parse(ord.items) : (ord.items || JSON.parse(ord.itemsJson || '[]'));
    } catch (e) {
      items = [];
    }
    return {
      ...ord,
      items
    };
  });

  return res.json(formattedOrders);
});

export default router;
