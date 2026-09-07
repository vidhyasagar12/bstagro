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
  db.prepare(`
    INSERT INTO customers (id, shopName, ownerName, phone, pin, businessType, address)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(newId, shopName.trim(), ownerName.trim(), cleanPhone, pin.trim(), businessType || 'Restaurant / Hotel', address || '');

  const newCustomer = {
    id: newId,
    shopName,
    ownerName,
    phone: cleanPhone,
    pin,
    businessType,
    address,
    customPrices: {}
  };

  return res.json({ success: true, customer: newCustomer });
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
  } else {
    const cleanPrice = Math.max(0, parseFloat(customPrice) || 0);
    db.prepare(`
      INSERT INTO custom_prices (id, customerId, productId, customPrice, updatedAt)
      VALUES (?, ?, ?, ?, datetime('now'))
      ON CONFLICT(customerId, productId) DO UPDATE SET
        customPrice = excluded.customPrice,
        updatedAt = datetime('now')
    `).run(`cp-${id}-${productId}`, id, productId, cleanPrice);
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
