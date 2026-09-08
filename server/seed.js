import db from './db.js';

export function seedDb() {
  // Clear any existing pre-seeded mock data to ensure clean production DB state
  try {
    const clearTransaction = db.transaction(() => {
      // Clean old sample seeded products/customers/orders if present
      db.prepare("DELETE FROM custom_prices WHERE id LIKE 'cp-cust-%'").run();
      db.prepare("DELETE FROM orders WHERE id LIKE 'ord-seed-%'").run();
      db.prepare("DELETE FROM customers WHERE id LIKE 'cust-bawarchi' OR id LIKE 'cust-lakshmi-sweets'").run();
      db.prepare("DELETE FROM products WHERE id IN ('bst-paneer-1kg', 'bst-fresh-khova-1kg', 'bst-paneer-5kg', 'milkymist-toned-milk-1l', 'milkymist-paneer-1kg', 'milkymist-mozzarella-diced-2kg', 'amul-salted-butter-500g', 'amul-processed-cheese-1kg', 'doodhshakti-unsalted-white-butter-500g', 'sri-murugan-ghee-1l')").run();
    });
    clearTransaction();
    console.log('✅ SQLite Database checked: Production ready with clean initial dataset.');
  } catch (err) {
    console.error('⚠️ Notice clearing seed data:', err.message);
  }
}

