const API_BASE = '/api';

export const api = {
  // Fetch Products Catalog (Server evaluates customer custom prices if token is provided)
  async getProducts(token = null) {
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${API_BASE}/products`, { headers });
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
  },

  // Customer Shop Login
  async loginCustomer(phone, pin) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, pin })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
  },

  // Customer Shop Self-Registration
  async registerCustomer(customerData) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customerData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    return data;
  },

  // Admin PIN Verification
  async verifyAdmin(adminPin) {
    const res = await fetch(`${API_BASE}/auth/admin-verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminPin })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Admin verification failed');
    return data;
  },

  // Admin: Get All Customers with Custom Prices
  async getCustomers() {
    const res = await fetch(`${API_BASE}/customers`);
    if (!res.ok) throw new Error('Failed to fetch customers');
    return res.json();
  },

  // Admin: Add New Shop Account
  async addCustomer(customerData) {
    const res = await fetch(`${API_BASE}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customerData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add customer');
    return data;
  },

  // Admin: Set or Clear Customer Custom Product Price
  async updateCustomerCustomPrice(customerId, productId, customPrice) {
    const res = await fetch(`${API_BASE}/customers/${customerId}/custom-price`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, customPrice })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update custom price');
    return data;
  },

  // Admin: Update Product Base Catalog Price
  async updateBasePrice(productId, price) {
    const res = await fetch(`${API_BASE}/products/${productId}/base-price`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update base price');
    return data;
  },

  // Submit New Wholesale Order
  async createOrder(orderData) {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit order');
    return data;
  },

  // Admin: Get Order History
  async getOrders() {
    const res = await fetch(`${API_BASE}/orders`);
    if (!res.ok) throw new Error('Failed to fetch orders');
    return res.json();
  }
};
