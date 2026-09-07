import db from './db.js';

export function seedDb() {
  // Check if products table is empty
  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get().count;

  if (productCount === 0) {
    console.log('🌱 Seeding initial products dataset into SQLite...');

    const insertProduct = db.prepare(`
      INSERT INTO products (id, name, brand, brandId, category, price, packSize, image, description, rating, reviews, inStock, isFlagship)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const products = [
      {
        id: "bst-paneer-1kg",
        name: "BST Fresh Cottage Paneer 1kg",
        brand: "BST Agro & Dairy",
        brandId: "bst",
        category: "Paneer & Khova",
        price: 250,
        packSize: "1 kg Pack",
        image: "/bst-paneer.png",
        description: "100% Fresh & Pure cottage cheese processed directly at BST dairy plant. Super soft texture, rich milk protein, authentic taste, ideal for paneer butter masala, tikka & commercial kitchens.",
        rating: 5.0,
        reviews: 340,
        inStock: 1,
        isFlagship: 1
      },
      {
        id: "bst-fresh-khova-1kg",
        name: "Fresh Khova 1kg",
        brand: "BST Agro & Dairy",
        brandId: "bst",
        category: "Paneer & Khova",
        price: 325,
        packSize: "1 kg Pack",
        image: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&q=80&w=600",
        description: "Fresh pure milk khova (Mawa) prepared daily. High fat content, rich aroma, perfect for gulab jamun, peda, sweet delicacies & restaurant gravies.",
        rating: 4.8,
        reviews: 84,
        inStock: 1,
        isFlagship: 0
      },
      {
        id: "bst-paneer-5kg",
        name: "BST Fresh Cottage Paneer 5kg Bulk Block",
        brand: "BST Agro & Dairy",
        brandId: "bst",
        category: "Paneer & Khova",
        price: 1200,
        packSize: "5 kg Bulk Pack",
        image: "/bst-paneer.png",
        description: "5kg Commercial Hotel & Catering Bulk Pack of pure fresh BST Paneer. Direct factory rate, zero preservatives, high protein yield for large kitchens & banquets.",
        rating: 4.9,
        reviews: 198,
        inStock: 1,
        isFlagship: 1
      },
      {
        id: "milkymist-toned-milk-1l",
        name: "Milky Mist Toned Milk 1Ltr",
        brand: "Milky Mist",
        brandId: "milkymist",
        category: "Dairy & Milk",
        price: 70,
        packSize: "1 Ltr Tetra Pack",
        image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=600",
        description: "UHT Toned Milk in hygienic 6-layer Tetra pack. Long shelf life, zero preservatives, enriched with Calcium and Vitamin D.",
        rating: 4.7,
        reviews: 210,
        inStock: 1,
        isFlagship: 0
      },
      {
        id: "milkymist-paneer-1kg",
        name: "Milky Mist Paneer 1kg Pack",
        brand: "Milky Mist",
        brandId: "milkymist",
        category: "Paneer & Khova",
        price: 380,
        packSize: "1 kg Pack",
        image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&q=80&w=600",
        description: "Fresh vacuum sealed Milky Mist paneer block. High moisture retention, sliceable cubes.",
        rating: 4.6,
        reviews: 95,
        inStock: 1,
        isFlagship: 0
      },
      {
        id: "milkymist-mozzarella-diced-2kg",
        name: "Milky Mist Mozzarella Diced Cheese 2kg",
        brand: "Milky Mist",
        brandId: "milkymist",
        category: "Cheese & Butter",
        price: 950,
        packSize: "2 kg Pack",
        image: "https://images.unsplash.com/photo-1452195100486-9cc805987862?auto=format&fit=crop&q=80&w=600",
        description: "Pre-diced shredded mozzarella pizza cheese. Superior meltability and elastic stretch for pizzeria & restaurant operations.",
        rating: 4.9,
        reviews: 142,
        inStock: 1,
        isFlagship: 0
      },
      {
        id: "amul-salted-butter-500g",
        name: "Amul Salted Butter 500g",
        brand: "Amul",
        brandId: "amul",
        category: "Cheese & Butter",
        price: 285,
        packSize: "500g Pack",
        image: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&q=80&w=600",
        description: "Utterly Butterly Delicious Amul Salted Butter. Made from pure cow & buffalo milk cream.",
        rating: 4.9,
        reviews: 310,
        inStock: 1,
        isFlagship: 0
      },
      {
        id: "amul-processed-cheese-1kg",
        name: "Amul Processed Cheese Block 1kg",
        brand: "Amul",
        brandId: "amul",
        category: "Cheese & Butter",
        price: 510,
        packSize: "1 kg Block",
        image: "https://images.unsplash.com/photo-1552767059-ce182ead8c1b?auto=format&fit=crop&q=80&w=600",
        description: "Amul processed cheese block 1kg. Rich wholesome taste for sandwiches, cheese toast & snacks.",
        rating: 4.8,
        reviews: 165,
        inStock: 1,
        isFlagship: 0
      },
      {
        id: "doodhshakti-unsalted-white-butter-500g",
        name: "Doodh Shakti Unsalted White Butter 500g",
        brand: "Nutralite / Doodh Shakti",
        brandId: "doodhshakti",
        category: "Cheese & Butter",
        price: 250,
        packSize: "500g Pack",
        image: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&q=80&w=600",
        description: "Nutralite Doodh Shakti Professional White Unsalted Butter 500g. Pure cream butter for bakery, sweets & cooking.",
        rating: 4.7,
        reviews: 64,
        inStock: 1,
        isFlagship: 0
      },
      {
        id: "sri-murugan-ghee-1l",
        name: "Sri Murugan Ghee 1Ltr",
        brand: "Sri Murugan",
        brandId: "srimurugan",
        category: "Dairy & Ghee",
        price: 740,
        packSize: "1 Ltr Pack",
        image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=600",
        description: "Traditional pure granulated Cow Ghee with rich golden color and authentic aroma. Essential for sweets & rice dishes.",
        rating: 4.9,
        reviews: 156,
        inStock: 1,
        isFlagship: 0
      }
    ];

    const seedTransaction = db.transaction(() => {
      for (const p of products) {
        insertProduct.run(p.id, p.name, p.brand, p.brandId, p.category, p.price, p.packSize, p.image, p.description, p.rating, p.reviews, p.inStock, p.isFlagship);
      }
    });

    seedTransaction();
    console.log('✅ 10 core products seeded into SQLite.');
  }

  // Check if customers table is empty
  const customerCount = db.prepare('SELECT COUNT(*) as count FROM customers').get().count;

  if (customerCount === 0) {
    console.log('🌱 Seeding initial customer accounts into SQLite...');

    const insertCustomer = db.prepare(`
      INSERT INTO customers (id, shopName, ownerName, phone, pin, businessType, address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertCustomPrice = db.prepare(`
      INSERT INTO custom_prices (id, customerId, productId, customPrice)
      VALUES (?, ?, ?, ?)
    `);

    const customers = [
      {
        id: "cust-bawarchi",
        shopName: "Hotel Grand Bawarchi",
        ownerName: "Ramesh Kumar",
        phone: "9876543210",
        pin: "1234",
        businessType: "Restaurant / Hotel",
        address: "Plot 12, Main Road, Amberpet, Hyderabad",
        customPrices: {
          "bst-paneer-1kg": 220,
          "bst-paneer-5kg": 1050,
          "bst-fresh-khova-1kg": 300,
          "milkymist-mozzarella-diced-2kg": 900
        }
      },
      {
        id: "cust-lakshmi-sweets",
        shopName: "Sri Lakshmi Sweets & Bakers",
        ownerName: "Venkatesh Rao",
        phone: "9876543211",
        pin: "5678",
        businessType: "Sweet Shop & Bakery",
        address: "Shop 4, Koti Commercial Complex, Hyderabad",
        customPrices: {
          "bst-paneer-1kg": 230,
          "bst-fresh-khova-1kg": 290,
          "sri-murugan-ghee-1l": 710
        }
      }
    ];

    const customerTransaction = db.transaction(() => {
      for (const c of customers) {
        insertCustomer.run(c.id, c.shopName, c.ownerName, c.phone, c.pin, c.businessType, c.address);
        
        for (const [prodId, price] of Object.entries(c.customPrices)) {
          insertCustomPrice.run(`cp-${c.id}-${prodId}`, c.id, prodId, price);
        }
      }
    });

    customerTransaction();
    console.log('✅ Initial shop accounts & custom prices seeded into SQLite.');
  }

  // Check if orders table is empty and seed initial B2B sample orders
  const orderCount = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;

  if (orderCount === 0) {
    console.log('🌱 Seeding initial sample B2B wholesale orders into SQLite...');

    const insertOrder = db.prepare(`
      INSERT INTO orders (id, customerId, shopName, ownerName, phone, address, totalAmount, itemsJson, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const sampleOrders = [
      {
        id: `ord-seed-001`,
        customerId: "cust-bawarchi",
        shopName: "Hotel Grand Bawarchi",
        ownerName: "Ramesh Kumar",
        phone: "9876543210",
        address: "Plot 12, Main Road, Amberpet, Hyderabad",
        totalAmount: 2800,
        status: "Submitted",
        itemsJson: JSON.stringify([
          { id: "bst-paneer-1kg", name: "BST Fresh Cottage Paneer 1kg", packSize: "1 kg Pack", price: 220, qty: 10 },
          { id: "bst-fresh-khova-1kg", name: "Fresh Khova 1kg", packSize: "1 kg Pack", price: 300, qty: 2 }
        ])
      },
      {
        id: `ord-seed-002`,
        customerId: "cust-lakshmi-sweets",
        shopName: "Sri Lakshmi Sweets & Bakers",
        ownerName: "Venkatesh Rao",
        phone: "9876543211",
        address: "Shop 4, Koti Commercial Complex, Hyderabad",
        totalAmount: 5950,
        status: "Submitted",
        itemsJson: JSON.stringify([
          { id: "bst-paneer-5kg", name: "BST Fresh Cottage Paneer 5kg Bulk Block", packSize: "5 kg Bulk Pack", price: 1200, qty: 2 },
          { id: "sri-murugan-ghee-1l", name: "Sri Murugan Ghee 1Ltr", packSize: "1 Ltr Pack", price: 710, qty: 5 }
        ])
      }
    ];

    const orderTransaction = db.transaction(() => {
      for (const ord of sampleOrders) {
        insertOrder.run(ord.id, ord.customerId, ord.shopName, ord.ownerName, ord.phone, ord.address, ord.totalAmount, ord.itemsJson, ord.status);
      }
    });

    orderTransaction();
    console.log('✅ Initial sample wholesale B2B orders seeded into SQLite.');
  }
}
