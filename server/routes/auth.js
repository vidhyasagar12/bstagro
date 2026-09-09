import express from 'express';
import jwt from 'jsonwebtoken';
import { supabase, isSupabaseConfigured, safeSupabaseUpsert } from '../supabaseClient.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'bst-agro-secret-key-2026';

// Customer Shop Login Endpoint (Phone + 4-Digit PIN)
router.post('/login', async (req, res) => {
  const { phone, pin } = req.body;

  if (!phone || !pin) {
    return res.status(400).json({ error: 'Phone number and 4-digit PIN are required.' });
  }

  if (!isSupabaseConfigured) {
    return res.status(503).json({ error: 'Supabase database is not configured on backend.' });
  }

  const cleanPhone = phone.trim().replace(/[^0-9]/g, '');

  try {
    const { data: raw, error: fetchErr } = await supabase.from('customers').select('*').eq('phone', cleanPhone).maybeSingle();
    
    if (fetchErr) {
      return res.status(500).json({ error: `Supabase login query error: ${fetchErr.message}` });
    }

    if (!raw) {
      return res.status(401).json({ error: 'Invalid Phone Number or 4-Digit Security PIN.' });
    }

    const customer = {
      id: String(raw.id),
      shopName: raw.shopName || raw.shop_name || raw.name || '',
      ownerName: raw.ownerName || raw.owner_name || '',
      phone: String(raw.phone || ''),
      pin: String(raw.pin || ''),
      businessType: raw.businessType || raw.business_type || 'Restaurant / Hotel',
      address: raw.address || ''
    };

    if (String(customer.pin).trim() !== String(pin).trim()) {
      return res.status(401).json({ error: 'Invalid Phone Number or 4-Digit Security PIN.' });
    }

    // Fetch custom prices for this customer
    let customPricesRows = [];
    const { data: cpData, error: cpErr } = await supabase.from('custom_prices').select('*').eq('customerId', customer.id);
    if (!cpErr && cpData) {
      customPricesRows = cpData;
    } else {
      const { data: cpDataSnake } = await supabase.from('custom_prices').select('*').eq('customer_id', customer.id);
      customPricesRows = cpDataSnake || [];
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
  } catch (err) {
    return res.status(500).json({ error: `Database error: ${err.message}` });
  }
});

// Customer Shop Self-Registration Endpoint
router.post('/register', async (req, res) => {
  const { shopName, ownerName, phone, pin, businessType, address } = req.body;

  if (!shopName || !ownerName || !phone || !pin) {
    return res.status(400).json({ error: 'Shop Name, Owner Name, Phone, and 4-Digit PIN are required.' });
  }

  if (!isSupabaseConfigured) {
    return res.status(503).json({ error: 'Supabase database is not configured on backend.' });
  }

  const cleanPhone = phone.trim().replace(/[^0-9]/g, '');

  try {
    // Check if phone already exists
    const { data: existing, error: existErr } = await supabase.from('customers').select('id').eq('phone', cleanPhone).maybeSingle();
    
    if (existErr) {
      return res.status(500).json({ error: `Supabase database error checking existing customer: ${existErr.message}` });
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

    // 1. Try camelCase payload with auto column-pruning helper
    let { error: insertErr } = await safeSupabaseUpsert('customers', newCustomer);

    // 2. Fallback to snake_case payload if camelCase fails completely
    if (insertErr) {
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
      const { error: fallbackErr } = await safeSupabaseUpsert('customers', snakeCustomer);
      if (fallbackErr) {
        return res.status(500).json({ error: `Failed to save customer to Supabase: ${insertErr.message}` });
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
  } catch (err) {
    return res.status(500).json({ error: `Registration error: ${err.message}` });
  }
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
