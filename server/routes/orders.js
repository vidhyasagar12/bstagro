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
    customerId: customerId || null,
    shopName: shopName.trim(),
    ownerName: (ownerName || '').trim(),
    phone: phone.trim(),
    address: (address || '').trim(),
    totalAmount: cleanTotal,
    itemsJson: itemsJsonStr,
    status: 'Submitted',
    createdAt: new Date().toISOString()
  };

  try {
    db.prepare(`
      INSERT INTO orders (id, customerId, shopName, ownerName, phone, address, totalAmount, itemsJson, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Submitted')
    `).run(orderId, newOrder.customerId, newOrder.shopName, newOrder.ownerName, newOrder.phone, newOrder.address, cleanTotal, itemsJsonStr);
  } catch (e) {
    console.warn('SQLite order insert warning:', e);
  }

  if (isSupabaseConfigured) {
    try {
      const { error: sbErr } = await supabase.from('orders').upsert([newOrder]);
      if (sbErr) {
        console.warn('Supabase order insert warning (camelCase):', sbErr.message);
        const snakeOrder = {
          id: orderId,
          customer_id: newOrder.customerId,
          shop_name: newOrder.shopName,
          owner_name: newOrder.ownerName,
          phone: newOrder.phone,
          address: newOrder.address,
          total_amount: cleanTotal,
          items_json: itemsJsonStr,
          status: 'Submitted',
          created_at: newOrder.createdAt
        };
        await supabase.from('orders').upsert([snakeOrder]);
      }
    } catch (err) {
      console.warn('Supabase order insert exception:', err.message);
    }
  }

  const returnedOrder = {
    ...newOrder,
    items
  };

  return res.json({ success: true, order: returnedOrder });
});

// Admin Get Order History
router.get('/', async (req, res) => {
  let sqliteOrders = [];
  let sbOrders = [];

  try {
    sqliteOrders = db.prepare('SELECT * FROM orders ORDER BY createdAt DESC').all();
  } catch (e) {}

  if (isSupabaseConfigured) {
    try {
      const { data, error: ordErr } = await supabase.from('orders').select('*');
      if (ordErr) console.warn('Supabase orders fetch error:', ordErr.message);
      sbOrders = data || [];
    } catch (err) {
      console.warn('Supabase orders fetch fallback to SQLite:', err.message);
    }
  }

  const orderMap = new Map();
  sqliteOrders.forEach(ord => orderMap.set(ord.id, ord));
  sbOrders.forEach(ord => orderMap.set(ord.id, { ...orderMap.get(ord.id), ...ord }));

  const mergedOrders = Array.from(orderMap.values());

  const formattedOrders = mergedOrders.map(ord => {
    let items = [];
    try {
      const jsonRaw = ord.itemsJson || ord.items_json || ord.items || '[]';
      items = typeof jsonRaw === 'string' ? JSON.parse(jsonRaw) : (Array.isArray(jsonRaw) ? jsonRaw : []);
    } catch (e) {
      items = [];
    }
    return {
      id: ord.id,
      customerId: ord.customerId || ord.customer_id,
      shopName: ord.shopName || ord.shop_name || '',
      ownerName: ord.ownerName || ord.owner_name || '',
      phone: ord.phone || '',
      address: ord.address || '',
      totalAmount: ord.totalAmount !== undefined ? ord.totalAmount : ord.total_amount,
      status: ord.status || 'Submitted',
      createdAt: ord.createdAt || ord.created_at || new Date().toISOString(),
      items
    };
  });

  return res.json(formattedOrders);
});

export default router;
