// Initial Pre-loaded Customer Accounts (Shops & Hotels)
export const INITIAL_CUSTOMERS = [
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
      "vintage-khova-5kg": 1250,
      "sri-murugan-ghee-1l": 710
    }
  }
];

// Helper to calculate effective price for a customer (strictly non-negative)
export const getEffectivePrice = (product, customer) => {
  if (!product) return 0;
  if (customer && customer.customPrices && customer.customPrices[product.id] !== undefined) {
    return Math.max(0, parseFloat(customer.customPrices[product.id]) || 0);
  }
  return Math.max(0, parseFloat(product.price) || 0);
};
