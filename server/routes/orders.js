import express from 'express';
import db from '../db.js';

const router = express.Router();

// Record New Wholesale Order Endpoint
router.post('/', (req, res) => {
  const { customerId, shopName, ownerName, phone, address, totalAmount, items } = req.body;

  if (!shopName || !phone || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Shop Name, Phone, and Order Items are required.' });
  }

  const orderId = `ORD-${Date.now()}`;
  const cleanTotal = Math.max(0, parseFloat(totalAmount) || 0);
  const itemsJsonStr = JSON.stringify(items);

  db.prepare(`
    INSERT INTO orders (id, customerId, shopName, ownerName, phone, address, totalAmount, itemsJson, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Submitted')
  `).run(orderId, customerId || null, shopName, ownerName || '', phone, address || '', cleanTotal, itemsJsonStr);

// Helper: Send Telegram Bot Notification if TELEGRAM_BOT_TOKEN & TELEGRAM_CHAT_ID are set
const sendTelegramOrderNotification = async (order) => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) return;

  const itemsList = order.items.map(it => `• ${it.name} x ${it.qty} = ₹${it.price * it.qty}`).join('\n');
  const message = `🔔 *NEW ORDER RECEIVED - BST AGRO*

🏢 *Shop*: ${order.shopName}
👤 *Owner*: ${order.ownerName || 'Customer'}
📞 *Phone*: ${order.phone}
📍 *Address*: ${order.address || 'Standard Address'}
💰 *Total Amount*: ₹${order.totalAmount}

📦 *Items*:
${itemsList}`;

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown'
      })
    });
  } catch (err) {
    console.warn('Telegram notification failed:', err.message);
  }
};

  const newOrder = {
    id: orderId,
    customerId,
    shopName,
    ownerName,
    phone,
    address,
    totalAmount: cleanTotal,
    items,
    status: 'Submitted',
    createdAt: new Date().toISOString()
  };

  // Trigger optional Telegram push notification
  sendTelegramOrderNotification(newOrder);

  return res.json({ success: true, order: newOrder });
});

// Admin Get Order History
router.get('/', (req, res) => {
  const orders = db.prepare('SELECT * FROM orders ORDER BY createdAt DESC').all();

  const formattedOrders = orders.map(ord => {
    let items = [];
    try {
      items = JSON.parse(ord.itemsJson);
    } catch (e) {
      items = [];
    }
    return {
      ...ord,
      items
    };
  });

  return res.json(formattedOrders);
});

export default router;
