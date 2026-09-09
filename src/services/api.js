const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

async function handleResponse(res, defaultErrorMsg = 'API Request Failed') {
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (err) {
    if (!res.ok) {
      throw new Error(`Server Error (${res.status}): Please check backend deployment at ${API_BASE}`);
    }
    throw new Error('Invalid JSON response received from API server.');
  }

  if (!res.ok) {
    throw new Error(data.error || defaultErrorMsg);
  }

  return data;
}

export const api = {
  // Fetch Products Catalog (Server evaluates customer custom prices if token is provided)
  async getProducts(token = null) {
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${API_BASE}/products`, { headers });
    return handleResponse(res, 'Failed to fetch products');
  },

  // Customer Shop Login
  async loginCustomer(phone, pin) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, pin })
    });
    return handleResponse(res, 'Login failed');
  },

  // Customer Shop Self-Registration
  async registerCustomer(customerData) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customerData)
    });
    return handleResponse(res, 'Registration failed');
  },

  // Admin PIN Verification
  async verifyAdmin(adminPin) {
    const res = await fetch(`${API_BASE}/auth/admin-verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminPin })
    });
    return handleResponse(res, 'Admin verification failed');
  },

  // Admin: Get All Customers with Custom Prices
  async getCustomers() {
    const res = await fetch(`${API_BASE}/customers`);
    return handleResponse(res, 'Failed to fetch customers');
  },

  // Admin: Add New Shop Account
  async addCustomer(customerData) {
    const res = await fetch(`${API_BASE}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customerData)
    });
    return handleResponse(res, 'Failed to add customer');
  },

  // Admin: Set or Clear Customer Custom Product Price
  async updateCustomerCustomPrice(customerId, productId, customPrice) {
    const res = await fetch(`${API_BASE}/customers/${customerId}/custom-price`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, customPrice })
    });
    return handleResponse(res, 'Failed to update custom price');
  },

  // Admin: Update Product Base Catalog Price
  async updateBasePrice(productId, price) {
    const res = await fetch(`${API_BASE}/products/${productId}/base-price`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price })
    });
    return handleResponse(res, 'Failed to update base price');
  },

  // Admin: Create New Product
  async createProduct(productData) {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    });
    return handleResponse(res, 'Failed to create product');
  },

  // Admin: Update Existing Product
  async updateProduct(productId, productData) {
    const res = await fetch(`${API_BASE}/products/${productId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    });
    return handleResponse(res, 'Failed to update product');
  },

  // Admin: Delete Product
  async deleteProduct(productId) {
    const res = await fetch(`${API_BASE}/products/${productId}`, {
      method: 'DELETE'
    });
    return handleResponse(res, 'Failed to delete product');
  },

  // Admin: Upload Product Image (Base64)
  async uploadProductImage(imageData, filename) {
    const res = await fetch(`${API_BASE}/products/upload-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageData, filename })
    });
    return handleResponse(res, 'Failed to upload image');
  },

  // Submit New Wholesale Order
  async createOrder(orderData) {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    return handleResponse(res, 'Failed to submit order');
  },

  // Admin: Get Order History
  async getOrders() {
    const res = await fetch(`${API_BASE}/orders`);
    return handleResponse(res, 'Failed to fetch orders');
  }
};
