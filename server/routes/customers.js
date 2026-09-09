import express from 'express';
import db from '../db.js';
import { supabase, isSupabaseConfigured } from '../supabaseClient.js';

const router = express.Router();

// Admin Get All Customers with Custom Prices Map
router.get('/', async (req, res) => {
  let customers = [];
  let allCustomPrices = [];

  if (isSupabaseConfigured) {
    try {
      const [{ data: custData, error: custErr }, { data: cpData, error: cpErr }] = await Promise.all([
        supabase.from('customers').select('*'),
        supabase.from('custom_prices').select('*')
      ]);
      if (custErr) console.warn('Supabase customers fetch error:', custErr.message);
      if (cpErr) console.warn('Supabase custom_prices fetch error:', cpErr.message);
      
      customers = custData || db.prepare('SELECT * FROM customers ORDER BY createdAt DESC').all();
      allCustomPrices = cpData || db.prepare('SELECT customerId, productId, customPrice FROM custom_prices').all();
    } catch (err) {
      console.warn('Supabase DB customers fetch fallback to SQLite:', err.message);
      customers = db.prepare('SELECT * FROM customers ORDER BY createdAt DESC').all();
      allCustomPrices = db.prepare('SELECT customerId, productId, customPrice FROM custom_prices').all();
    }
  } else {
    customers = db.prepare('SELECT * FROM customers ORDER BY createdAt DESC').all();
    allCustomPrices = db.prepare('SELECT customerId, productId, customPrice FROM custom_prices').all();
  }

  const priceMapByCustomer = {};
  allCustomPrices.forEach(row => {
    if (!priceMapByCustomer[row.customerId]) {
      priceMapByCustomer[row.customerId] = {};
    }
    priceMapByCustomer[row.customerId][row.productId] = row.customPrice;
  });

  const fullCustomers = customers.map(c => ({
    ...c,
    customPrices: priceMapByCustomer[c.id] || {}
  }));

  return res.json(fullCustomers);
});

// Admin Add New Shop Account
router.post('/', async (req, res) => {
  const { shopName, ownerName, phone, pin, businessType, address } = req.body;

  if (!shopName || !ownerName || !phone || !pin) {
    return res.status(400).json({ error: 'Shop Name, Owner Name, Phone, and PIN are required.' });
  }

  const cleanPhone = phone.trim().replace(/[^0-9]/g, '');

  let existing = db.prepare('SELECT id FROM customers WHERE phone = ?').get(cleanPhone);
  if (!existing && isSupabaseConfigured) {
    const { data } = await supabase.from('customers').select('id').eq('phone', cleanPhone).maybeSingle();
    existing = data;
  }

  if (existing) {
    return res.status(400).json({ error: 'A shop account with this phone number already exists.' });
  }

  const newId = `cust-${Date.now()}`;
  const newCustomer = {
    id: newId,
    shopName: shopName.trim(),
    ownerName: ownerName.trim(),
    phone: cleanPhone,
    pin: pin.trim(),
    businessType: businessType || 'Restaurant / Hotel',
    address: address || '',
  };

  try {
    db.prepare(`
      INSERT INTO customers (id, shopName, ownerName, phone, pin, businessType, address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(newId, newCustomer.shopName, newCustomer.ownerName, cleanPhone, newCustomer.pin, newCustomer.businessType, newCustomer.address);
  } catch (e) {
    console.warn('SQLite customer insert warning:', e);
  }

  if (isSupabaseConfigured) {
    const { error: sbErr } = await supabase.from('customers').upsert([newCustomer]);
    if (sbErr) console.error('Supabase customer insert error:', sbErr);
  }

  return res.json({ success: true, customer: { ...newCustomer, customPrices: {} } });
});

// Admin Set or Remove Custom Item Price for a Customer
router.put('/:id/custom-price', async (req, res) => {
  const { id } = req.params;
  const { productId, customPrice } = req.body;

  if (!productId) {
    return res.status(400).json({ error: 'Product ID is required.' });
  }

  const cpId = `cp-${id}-${productId}`;

  if (customPrice === undefined || customPrice === null || customPrice === '') {
    db.prepare('DELETE FROM custom_prices WHERE customerId = ? AND productId = ?').run(id, productId);
    if (isSupabaseConfigured) {
      await supabase.from('custom_prices').delete().eq('customerId', id).eq('productId', productId);
    }
  } else {
    const cleanPrice = Math.max(0, parseFloat(customPrice) || 0);
    const cpObj = {
      id: cpId,
      customerId: id,
      productId,
      customPrice: cleanPrice
    };

    try {
      db.prepare(`
        INSERT INTO custom_prices (id, customerId, productId, customPrice, updatedAt)
        VALUES (?, ?, ?, ?, datetime('now'))
        ON CONFLICT(customerId, productId) DO UPDATE SET
          customPrice = excluded.customPrice,
          updatedAt = datetime('now')
      `).run(cpId, id, productId, cleanPrice);
    } catch (e) {
      console.warn('SQLite custom price insert warning:', e);
    }

    if (isSupabaseConfigured) {
      await supabase.from('custom_prices').upsert([cpObj]);
    }
  }

  // Return updated customer custom prices map
  let updatedPricesRows = [];
  if (isSupabaseConfigured) {
    const { data } = await supabase.from('custom_prices').select('productId, customPrice').eq('customerId', id);
    updatedPricesRows = data || db.prepare('SELECT productId, customPrice FROM custom_prices WHERE customerId = ?').all(id);
  } else {
    updatedPricesRows = db.prepare('SELECT productId, customPrice FROM custom_prices WHERE customerId = ?').all(id);
  }

  const updatedPricesMap = {};
  updatedPricesRows.forEach(row => {
    updatedPricesMap[row.productId] = row.customPrice;
  });

  return res.json({ success: true, customerId: id, customPrices: updatedPricesMap });
});

export default router;
