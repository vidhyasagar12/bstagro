import express from 'express';
import { supabase, isSupabaseConfigured } from '../supabaseClient.js';

const router = express.Router();

// Helper to normalize customer record from Supabase
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
  if (!isSupabaseConfigured) {
    return res.status(503).json({ error: 'Supabase database is not configured on backend.' });
  }

  try {
    const [{ data: custData, error: custErr }, { data: cpData, error: cpErr }] = await Promise.all([
      supabase.from('customers').select('*'),
      supabase.from('custom_prices').select('*')
    ]);

    if (custErr) {
      return res.status(500).json({ error: `Supabase fetch customers error: ${custErr.message}` });
    }

    const customers = (custData || []).map(normalizeCustomer).filter(Boolean);
    const cpRows = cpData || [];

    const priceMapByCustomer = {};
    cpRows.forEach(row => {
      const cId = String(row.customerId || row.customer_id);
      const pId = String(row.productId || row.product_id);
      const pVal = parseFloat(row.customPrice !== undefined ? row.customPrice : row.custom_price) || 0;
      
      if (!priceMapByCustomer[cId]) {
        priceMapByCustomer[cId] = {};
      }
      priceMapByCustomer[cId][pId] = pVal;
    });

    const fullCustomers = customers.map(c => ({
      ...c,
      customPrices: priceMapByCustomer[c.id] || {}
    }));

    return res.json(fullCustomers);
  } catch (err) {
    return res.status(500).json({ error: `Database error: ${err.message}` });
  }
});

// Admin Add New Shop Account
router.post('/', async (req, res) => {
  const { shopName, ownerName, phone, pin, businessType, address } = req.body;

  if (!shopName || !ownerName || !phone || !pin) {
    return res.status(400).json({ error: 'Shop Name, Owner Name, Phone, and PIN are required.' });
  }

  if (!isSupabaseConfigured) {
    return res.status(503).json({ error: 'Supabase database is not configured on backend.' });
  }

  const cleanPhone = phone.trim().replace(/[^0-9]/g, '');

  try {
    const { data: existing, error: checkErr } = await supabase.from('customers').select('id').eq('phone', cleanPhone).maybeSingle();
    
    if (checkErr) {
      return res.status(500).json({ error: `Supabase database error: ${checkErr.message}` });
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

    let { error: insertErr } = await supabase.from('customers').upsert([snakeCustomer]);
    if (insertErr) {
      const { error: fallbackErr } = await supabase.from('customers').upsert([newCustomer]);
      if (fallbackErr) {
        return res.status(500).json({ error: `Failed to insert customer: ${insertErr.message} | ${fallbackErr.message}` });
      }
    }

    return res.json({ success: true, customer: { ...newCustomer, customPrices: {} } });
  } catch (err) {
    return res.status(500).json({ error: `Insert error: ${err.message}` });
  }
});

// Admin Set or Remove Custom Item Price for a Customer
router.put('/:id/custom-price', async (req, res) => {
  const { id } = req.params;
  const { productId, customPrice } = req.body;

  if (!productId) {
    return res.status(400).json({ error: 'Product ID is required.' });
  }

  if (!isSupabaseConfigured) {
    return res.status(503).json({ error: 'Supabase database is not configured on backend.' });
  }

  const cpId = `cp-${id}-${productId}`;

  try {
    if (customPrice === undefined || customPrice === null || customPrice === '') {
      const { error: delErr } = await supabase.from('custom_prices').delete().eq('customerId', id).eq('productId', productId);
      if (delErr) {
        await supabase.from('custom_prices').delete().eq('customer_id', id).eq('product_id', productId);
      }
    } else {
      const cleanPrice = Math.max(0, parseFloat(customPrice) || 0);
      const cpObjCamel = {
        id: cpId,
        customerId: id,
        productId,
        customPrice: cleanPrice
      };
      const cpObjSnake = {
        id: cpId,
        customer_id: id,
        product_id: productId,
        custom_price: cleanPrice
      };

      let { error: upsertErr } = await supabase.from('custom_prices').upsert([cpObjSnake]);
      if (upsertErr) {
        const { error: fallbackErr } = await supabase.from('custom_prices').upsert([cpObjCamel]);
        if (fallbackErr) {
          return res.status(500).json({ error: `Failed to save custom price: ${upsertErr.message} | ${fallbackErr.message}` });
        }
      }
    }

    return res.json({ success: true, customerId: id, productId, customPrice });
  } catch (err) {
    return res.status(500).json({ error: `Custom price update error: ${err.message}` });
  }
});

export default router;
