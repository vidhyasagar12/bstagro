import express from 'express';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import { supabase, isSupabaseConfigured } from '../supabaseClient.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'bst-agro-secret-key-2026';

// Customer Shop Login Endpoint (Phone + 4-Digit PIN)
router.post('/login', async (req, res) => {
  const { phone, pin } = req.body;

  if (!phone || !pin) {
    return res.status(400).json({ error: 'Phone number and 4-digit PIN are required.' });
  }

  const cleanPhone = phone.trim().replace(/[^0-9]/g, '');
  let customer = null;

  if (isSupabaseConfigured) {
    try {
      const { data } = await supabase.from('customers').select('*').eq('phone', cleanPhone).maybeSingle();
      if (data) {
        customer = {
          id: String(data.id),
          shopName: data.shopName || data.shop_name || '',
          ownerName: data.ownerName || data.owner_name || '',
          phone: String(data.phone || ''),
          pin: String(data.pin || ''),
          businessType: data.businessType || data.business_type || 'Restaurant / Hotel',
          address: data.address || ''
        };
      }
    } catch (err) {
      console.warn('Supabase login check fallback to SQLite:', err.message);
    }
  }

  if (!customer) {
    try {
      const raw = db.prepare('SELECT * FROM customers WHERE phone = ?').get(cleanPhone);
      if (raw) {
        customer = {
          id: String(raw.id),
          shopName: raw.shopName || raw.shop_name || '',
          ownerName: raw.ownerName || raw.owner_name || '',
          phone: String(raw.phone || ''),
          pin: String(raw.pin || ''),
          businessType: raw.businessType || raw.business_type || 'Restaurant / Hotel',
          address: raw.address || ''
        };
      }
    } catch (e) {}
  }

  if (!customer || String(customer.pin).trim() !== pin.trim()) {
    return res.status(401).json({ error: 'Invalid Phone Number or 4-Digit Security PIN.' });
  }

  // Fetch customer custom prices
  let customPricesRows = [];
  if (isSupabaseConfigured) {
    try {
      const { data: cpData } = await supabase.from('custom_prices').select('*').eq('customerId', customer.id);
      customPricesRows = cpData || [];
      if (customPricesRows.length === 0) {
        const { data: cpDataSnake } = await supabase.from('custom_prices').select('*').eq('customer_id', customer.id);
        customPricesRows = cpDataSnake || [];
      }
    } catch (e) {}
  }
  if (customPricesRows.length === 0) {
    try {
      customPricesRows = db.prepare('SELECT customerId, productId, customPrice FROM custom_prices WHERE customerId = ?').all(customer.id);
    } catch (e) {}
  }

  const customPrices = {};
  customPricesRows.forEach(row => {
    const pId = row.productId || row.product_id;
    const pVal = row.customPrice || row.custom_price;
    if (pId && pVal !== undefined) {
      customPrices[pId] = pVal;
    }
  });

  const fullCustomer = {
    ...customer,
    customPrices
  };

  const token = jwt.sign(
    { id: customer.id, phone: customer.phone, shopName: customer.shopName, role: 'customer' },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  return res.json({
    success: true,
    token,
    customer: fullCustomer
  });
});

// Customer Shop Self-Registration Endpoint
router.post('/register', async (req, res) => {
  const { shopName, ownerName, phone, pin, businessType, address } = req.body;

  if (!shopName || !ownerName || !phone || !pin) {
    return res.status(400).json({ error: 'Shop Name, Owner Name, Phone, and 4-Digit PIN are required.' });
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
    return res.status(400).json({ error: 'A shop account with this phone number already exists. Please log in.' });
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

  // 1. Save to SQLite
  try {
    db.prepare(`
      INSERT INTO customers (id, shopName, ownerName, phone, pin, businessType, address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(newId, newCustomer.shopName, newCustomer.ownerName, cleanPhone, newCustomer.pin, newCustomer.businessType, newCustomer.address);
  } catch (e) {
    console.warn('SQLite register insert warning:', e);
  }

  // 2. Save to Supabase (try snake_case first as PostgreSQL defaults to snake_case)
  if (isSupabaseConfigured) {
    try {
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
      const { error: sbErr1 } = await supabase.from('customers').upsert([snakeCustomer]);
      if (sbErr1) {
        console.warn('Supabase register upsert warning (snake_case):', sbErr1.message);
        const { error: sbErr2 } = await supabase.from('customers').upsert([newCustomer]);
        if (sbErr2) {
          console.error('Supabase register upsert error (camelCase):', sbErr2.message);
        }
      }
    } catch (err) {
      console.error('Supabase customer register exception:', err.message);
    }
  }

  const token = jwt.sign(
    { id: newCustomer.id, phone: newCustomer.phone, shopName: newCustomer.shopName, role: 'customer' },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  return res.json({
    success: true,
    token,
    customer: { ...newCustomer, customPrices: {} }
  });
});

// Admin Security Verification Endpoint (Admin PIN: 9949694030)
router.post('/admin-verify', (req, res) => {
  const { adminPin } = req.body;

  if (!adminPin) {
    return res.status(400).json({ error: 'Admin PIN is required.' });
  }

  const validAdminPin = process.env.ADMIN_PIN || '9949694030';

  if (adminPin.trim() === validAdminPin) {
    const adminToken = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '12h' });
    return res.json({ success: true, token: adminToken });
  }

  return res.status(401).json({ error: 'Invalid Admin Security PIN.' });
});

export default router;
