import express from 'express';
import { supabase, isSupabaseConfigured, safeSupabaseUpsert } from '../supabaseClient.js';

const router = express.Router();

// Record New Wholesale Order Endpoint
router.post('/', async (req, res) => {
  const { customerId, shopName, ownerName, phone, address, totalAmount, items } = req.body;

  if (!shopName || !phone || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Shop Name, Phone, and Order Items are required.' });
  }

  if (!isSupabaseConfigured) {
    return res.status(503).json({ error: 'Supabase database is not configured on backend.' });
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

  const lowerOrder = {
    id: orderId,
    customerid: newOrder.customerId,
    shopname: newOrder.shopName,
    ownername: newOrder.ownerName,
    phone: newOrder.phone,
    address: newOrder.address,
    totalamount: cleanTotal,
    itemsjson: itemsJsonStr,
    status: 'Submitted',
    createdat: newOrder.createdAt
  };

  try {
    let { error: sbErr1 } = await safeSupabaseUpsert('orders', lowerOrder);
    if (sbErr1) {
      const { error: sbErr2 } = await safeSupabaseUpsert('orders', newOrder);
      if (sbErr2) {
        return res.status(500).json({ error: `Failed to insert order: ${sbErr1.message}` });
      }
    }

    const returnedOrder = {
      ...newOrder,
      items
    };

    return res.json({ success: true, order: returnedOrder });
  } catch (err) {
    return res.status(500).json({ error: `Order insert error: ${err.message}` });
  }
});

// Admin Get Order History
router.get('/', async (req, res) => {
  if (!isSupabaseConfigured) {
    return res.status(503).json({ error: 'Supabase database is not configured on backend.' });
  }

  try {
    const { data, error: ordErr } = await supabase.from('orders').select('*');
    if (ordErr) {
      return res.status(500).json({ error: `Supabase fetch orders error: ${ordErr.message}` });
    }

    const orders = data || [];

    const formattedOrders = orders.map(ord => {
      let items = [];
      try {
        const jsonRaw = ord.itemsjson || ord.itemsJson || ord.items_json || ord.items || '[]';
        items = typeof jsonRaw === 'string' ? JSON.parse(jsonRaw) : (Array.isArray(jsonRaw) ? jsonRaw : []);
      } catch (e) {
        items = [];
      }
      return {
        id: String(ord.id),
        customerId: ord.customerid || ord.customerId || ord.customer_id,
        shopName: ord.shopname || ord.shopName || ord.shop_name || '',
        ownerName: ord.ownername || ord.ownerName || ord.owner_name || '',
        phone: String(ord.phone || ''),
        address: ord.address || '',
        totalAmount: ord.totalamount !== undefined ? parseFloat(ord.totalamount) || 0 : (parseFloat(ord.totalAmount || ord.total_amount) || 0),
        status: ord.status || 'Submitted',
        createdAt: ord.createdat || ord.createdAt || ord.created_at || new Date().toISOString(),
        items
      };
    });

    return res.json(formattedOrders);
  } catch (err) {
    return res.status(500).json({ error: `Fetch orders error: ${err.message}` });
  }
});

export default router;
