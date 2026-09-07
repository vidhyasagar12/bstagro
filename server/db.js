import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../bst_agro.db');
const db = new Database(dbPath);

// Enable Foreign Key constraints
db.pragma('foreign_keys = ON');

// Initialize Database Tables
export function initDb() {
  // Customers Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      shopName TEXT NOT NULL,
      ownerName TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      pin TEXT NOT NULL,
      businessType TEXT,
      address TEXT,
      createdAt TEXT DEFAULT (datetime('now'))
    )
  `);

  // Products Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      brand TEXT NOT NULL,
      brandId TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      packSize TEXT NOT NULL,
      image TEXT,
      description TEXT,
      rating REAL DEFAULT 4.8,
      reviews INTEGER DEFAULT 45,
      inStock INTEGER DEFAULT 1,
      isFlagship INTEGER DEFAULT 0
    )
  `);

  // Custom Customer Prices Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS custom_prices (
      id TEXT PRIMARY KEY,
      customerId TEXT NOT NULL,
      productId TEXT NOT NULL,
      customPrice REAL NOT NULL,
      updatedAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE CASCADE,
      FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE,
      UNIQUE(customerId, productId)
    )
  `);

  // Orders Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customerId TEXT,
      shopName TEXT NOT NULL,
      ownerName TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT,
      totalAmount REAL NOT NULL,
      status TEXT DEFAULT 'Submitted',
      itemsJson TEXT NOT NULL,
      createdAt TEXT DEFAULT (datetime('now'))
    )
  `);

  console.log('✅ SQLite Database schema initialized successfully at:', dbPath);
}

export default db;
