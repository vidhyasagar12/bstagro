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
      customer = data;
    } catch (err) {
      console.warn('Supabase login check fallback to SQLite:', err.message);
    }
  }

  if (!customer) {
    customer = db.prepare('SELECT * FROM customers WHERE phone = ?').get(cleanPhone);
  }

  if (!customer || String(customer.pin).trim() !== pin.trim()) {
    return res.status(401).json({ error: 'Invalid Phone Number or 4-Digit Security PIN.' });
  }

  // Fetch customer custom prices
  let customPricesRows = [];
  if (isSupabaseConfigured) {
    const { data: cpData } = await supabase.from('custom_prices').select('productId, customPrice').eq('customerId', customer.id);
    customPricesRows = cpData || db.prepare('SELECT productId, customPrice FROM custom_prices WHERE customerId = ?').all(customer.id);
  } else {
    customPricesRows = db.prepare('SELECT productId, customPrice FROM custom_prices WHERE customerId = ?').all(customer.id);
  }

  const customPrices = {};
  customPricesRows.forEach(row => {
    customPrices[row.productId] = row.customPrice;
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

  let existing = db.prepare('SELECT id FROM customers WHERE phone = ?').get(cleanPhone);
  if (!existing && isSupabaseConfigured) {
    const { data } = await supabase.from('customers').select('id').eq('phone', cleanPhone).maybeSingle();
    existing = data;
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
  };

  try {
    db.prepare(`
      INSERT INTO customers (id, shopName, ownerName, phone, pin, businessType, address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(newId, newCustomer.shopName, newCustomer.ownerName, cleanPhone, newCustomer.pin, newCustomer.businessType, newCustomer.address);
  } catch (e) {
    console.warn('SQLite register warning:', e);
  }

  if (isSupabaseConfigured) {
    await supabase.from('customers').upsert([newCustomer]);
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
