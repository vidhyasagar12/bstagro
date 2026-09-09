import express from 'express';
import db from '../db.js';

const router = express.Router();

// Admin Get All Customers with Custom Prices Map
router.get('/', (req, res) => {
  const customers = db.prepare('SELECT * FROM customers ORDER BY createdAt DESC').all();
  const allCustomPrices = db.prepare('SELECT customerId, productId, customPrice FROM custom_prices').all();

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

// Admin Add New Shop Account
router.post('/', (req, res) => {
  const { shopName, ownerName, phone, pin, businessType, address } = req.body;

  if (!shopName || !ownerName || !phone || !pin) {
    return res.status(400).json({ error: 'Shop Name, Owner Name, Phone, and PIN are required.' });
  }

  const cleanPhone = phone.trim().replace(/[^0-9]/g, '');

  const existing = db.prepare('SELECT id FROM customers WHERE phone = ?').get(cleanPhone);
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

  db.prepare(`
    INSERT INTO customers (id, shopName, ownerName, phone, pin, businessType, address)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(newId, newCustomer.shopName, newCustomer.ownerName, cleanPhone, newCustomer.pin, newCustomer.businessType, newCustomer.address);

  // Sync to Supabase Postgres Database
  syncSupabase('customers', 'POST', newCustomer);

  return res.json({ success: true, customer: { ...newCustomer, customPrices: {} } });
});

// Admin Set or Remove Custom Item Price for a Customer
router.put('/:id/custom-price', (req, res) => {
  const { id } = req.params;
  const { productId, customPrice } = req.body;

  if (!productId) {
    return res.status(400).json({ error: 'Product ID is required.' });
  }

  // Check customer exists
  const customer = db.prepare('SELECT id FROM customers WHERE id = ?').get(id);
  if (!customer) {
    return res.status(404).json({ error: 'Customer not found.' });
  }

  // If customPrice is null/undefined or empty string, remove custom rate
  if (customPrice === undefined || customPrice === null || customPrice === '') {
    db.prepare('DELETE FROM custom_prices WHERE customerId = ? AND productId = ?').run(id, productId);
    syncSupabase('custom_prices', 'DELETE', null, `?customerId=eq.${id}&productId=eq.${productId}`);
  } else {
    const cleanPrice = Math.max(0, parseFloat(customPrice) || 0);
    const cpObj = {
      id: `cp-${id}-${productId}`,
      customerId: id,
      productId,
      customPrice: cleanPrice
    };
    db.prepare(`
      INSERT INTO custom_prices (id, customerId, productId, customPrice, updatedAt)
      VALUES (?, ?, ?, ?, datetime('now'))
      ON CONFLICT(customerId, productId) DO UPDATE SET
        customPrice = excluded.customPrice,
        updatedAt = datetime('now')
    `).run(cpObj.id, id, productId, cleanPrice);

    syncSupabase('custom_prices', 'POST', cpObj);
  }

  // Return updated customer custom prices map
  const updatedPricesRows = db.prepare('SELECT productId, customPrice FROM custom_prices WHERE customerId = ?').all(id);
  const updatedPricesMap = {};
  updatedPricesRows.forEach(row => {
    updatedPricesMap[row.productId] = row.customPrice;
  });

  return res.json({ success: true, customerId: id, customPrices: updatedPricesMap });
});

export default router;
