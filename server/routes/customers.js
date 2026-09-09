import express from 'express';
import db from '../db.js';
import { supabase, isSupabaseConfigured } from '../supabaseClient.js';

const router = express.Router();

// Helper to normalize customer record from Supabase or SQLite
function normalizeCustomer(c) {
  if (!c) return null;
  return {
    id: String(c.id),
    shopName: c.shopName || c.shop_name || '',
    ownerName: c.ownerName || c.owner_name || '',
    phone: String(c.phone || ''),
    pin: String(c.pin || ''),
    businessType: c.businessType || c.business_type || 'Restaurant / Hotel',
    address: c.address || '',
    createdAt: c.createdAt || c.created_at || new Date().toISOString()
  };
}

// Admin Get All Customers with Custom Prices Map
router.get('/', async (req, res) => {
  let sbCustomers = [];
  let sqliteCustomers = [];
  let allCustomPrices = [];

  // Fetch SQLite customers
  try {
    sqliteCustomers = db.prepare('SELECT * FROM customers ORDER BY createdAt DESC').all();
  } catch (err) {
    console.warn('SQLite fetch customers warning:', err.message);
  }

  // Fetch Supabase customers if configured
  if (isSupabaseConfigured) {
    try {
      const [{ data: custData, error: custErr }, { data: cpData, error: cpErr }] = await Promise.all([
        supabase.from('customers').select('*'),
        supabase.from('custom_prices').select('*')
      ]);
      if (custErr) console.warn('Supabase customers fetch error:', custErr.message);
      if (cpErr) console.warn('Supabase custom_prices fetch error:', cpErr.message);
      
      sbCustomers = custData || [];
      const sbCp = cpData || [];
      const sqliteCp = db.prepare('SELECT customerId, productId, customPrice FROM custom_prices').all();
      
      const cpMap = new Map();
      sqliteCp.forEach(cp => cpMap.set(`${cp.customerId}_${cp.productId}`, cp));
      sbCp.forEach(cp => cpMap.set(`${cp.customerId || cp.customer_id}_${cp.productId || cp.product_id}`, {
        customerId: cp.customerId || cp.customer_id,
        productId: cp.productId || cp.product_id,
        customPrice: cp.customPrice || cp.custom_price
      }));
      allCustomPrices = Array.from(cpMap.values());
    } catch (err) {
      console.warn('Supabase customers fetch fallback to SQLite:', err.message);
      allCustomPrices = db.prepare('SELECT customerId, productId, customPrice FROM custom_prices').all();
    }
  } else {
    allCustomPrices = db.prepare('SELECT customerId, productId, customPrice FROM custom_prices').all();
  }

  // Merge customers from SQLite and Supabase by ID
  const customerMap = new Map();
  sqliteCustomers.forEach(c => {
    const norm = normalizeCustomer(c);
    if (norm) customerMap.set(norm.id, norm);
  });
  sbCustomers.forEach(c => {
    const norm = normalizeCustomer(c);
    if (norm) customerMap.set(norm.id, { ...customerMap.get(norm.id), ...norm });
  });

  const mergedCustomers = Array.from(customerMap.values());

  const priceMapByCustomer = {};
  allCustomPrices.forEach(row => {
    if (!priceMapByCustomer[row.customerId]) {
      priceMapByCustomer[row.customerId] = {};
    }
    priceMapByCustomer[row.customerId][row.productId] = row.customPrice;
  });

  const fullCustomers = mergedCustomers.map(c => ({
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

  let existing = null;
  try {
    existing = db.prepare('SELECT id FROM customers WHERE phone = ?').get(cleanPhone);
  } catch (e) {}

  if (!existing && isSupabaseConfigured) {
    try {
      const { data } = await supabase.from('customers').select('id').eq('phone', cleanPhone).maybeSingle();
      existing = data;
    } catch (e) {}
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
    createdAt: new Date().toISOString()
  };

  // Insert into SQLite
  try {
    db.prepare(`
      INSERT INTO customers (id, shopName, ownerName, phone, pin, businessType, address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(newId, newCustomer.shopName, newCustomer.ownerName, cleanPhone, newCustomer.pin, newCustomer.businessType, newCustomer.address);
  } catch (e) {
    console.warn('SQLite customer insert warning:', e);
  }

  // Insert/Upsert into Supabase with dual casing support
  if (isSupabaseConfigured) {
    try {
      const { error: sbErr } = await supabase.from('customers').upsert([newCustomer]);
      if (sbErr) {
        console.warn('Supabase customer insert warning (camelCase):', sbErr.message);
        const snakeCustomer = {
          id: newId,
          shop_name: newCustomer.shopName,
          owner_name: newCustomer.ownerName,
          phone: cleanPhone,
          pin: newCustomer.pin,
          business_type: newCustomer.businessType,
          address: newCustomer.address,
          created_at: newCustomer.createdAt
        };
        await supabase.from('customers').upsert([snakeCustomer]);
      }
    } catch (err) {
      console.warn('Supabase customer insert error:', err.message);
    }
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
    try {
      db.prepare('DELETE FROM custom_prices WHERE customerId = ? AND productId = ?').run(id, productId);
    } catch (e) {}

    if (isSupabaseConfigured) {
      try {
        await supabase.from('custom_prices').delete().eq('customerId', id).eq('productId', productId);
        await supabase.from('custom_prices').delete().eq('customer_id', id).eq('product_id', productId);
      } catch (e) {}
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
        INSERT INTO custom_prices (id, customerId, productId, customPrice)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(customerId, productId) DO UPDATE SET customPrice = excluded.customPrice
      `).run(cpId, id, productId, cleanPrice);
    } catch (e) {
      console.warn('SQLite custom price insert warning:', e);
    }

    if (isSupabaseConfigured) {
      try {
        const { error: sbErr } = await supabase.from('custom_prices').upsert([cpObj]);
        if (sbErr) {
          await supabase.from('custom_prices').upsert([{
            id: cpId,
            customer_id: id,
            product_id: productId,
            custom_price: cleanPrice
          }]);
        }
      } catch (e) {}
    }
  }

  return res.json({ success: true, customerId: id, productId, customPrice });
});

export default router;
