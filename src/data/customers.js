// Initial Customer Accounts - Loaded dynamically from Supabase API
export const INITIAL_CUSTOMERS = [];

// Helper to calculate effective price for a customer (strictly non-negative)
export const getEffectivePrice = (product, customer) => {
  if (!product) return 0;
  if (customer && customer.customPrices && customer.customPrices[product.id] !== undefined) {
    return Math.max(0, parseFloat(customer.customPrices[product.id]) || 0);
  }
  return Math.max(0, parseFloat(product.price) || 0);
};

