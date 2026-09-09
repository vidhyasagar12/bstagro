import React, { useState, useEffect, useMemo } from 'react';
import { DeliveryTopBar } from './components/DeliveryTopBar';
import { Navbar } from './components/Navbar';
import { BrandNavStrip } from './components/BrandNavStrip';
import { HeroBanner } from './components/HeroBanner';
import { CategorySidebar } from './components/CategorySidebar';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { WholesaleModal } from './components/WholesaleModal';
import { ShopAuthModal } from './components/ShopAuthModal';
import { BrandAccordionSection } from './components/BrandAccordionSection';
import { FloatingWhatsAppBtn } from './components/FloatingWhatsAppBtn';
import { Footer } from './components/Footer';
import { PRODUCTS as INITIAL_PRODUCTS, CATEGORIES, BRANDS } from './data/products';
import { INITIAL_CUSTOMERS, getEffectivePrice } from './data/customers';
import { api } from './services/api';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AlertCircle, RefreshCw } from 'lucide-react';
import './App.css';

export function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');

  // Master Products State (Loads from localStorage cache instantly, then syncs with Supabase API)
  const [products, setProducts] = useState(() => {
    try {
      const cached = localStorage.getItem('bst_ecommerce_products_cache');
      return cached ? JSON.parse(cached) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  // Customers Database State (Loaded from Express Supabase API)
  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS);

  // Current Logged-In Shop Account (In-Memory state only - requires login every time site is accessed)
  const [currentCustomer, setCurrentCustomer] = useState(null);

  // Clear any persistent customer login tokens on mount so login is required every access
  useEffect(() => {
    localStorage.removeItem('bst_ecommerce_active_customer');
    localStorage.removeItem('bst_agro_token');
  }, []);

  // Order Logs State
  const [orders, setOrders] = useState([]);

  // Selected Product for Quick-View Modal
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  // Cart State (Starts empty unless saved in local storage)
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('bst_ecommerce_cart');
    return saved ? JSON.parse(saved) : [];
  });

  // Modals & Pages
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWholesaleModalOpen, setIsWholesaleModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  // Dedicated Admin Page View State (#admin)
  const [isAdminView, setIsAdminView] = useState(() => {
    return window.location.hash === '#admin' || window.location.search.includes('admin=true');
  });

  // Listen to URL hash changes for #admin route
  useEffect(() => {
    const checkAdminRoute = () => {
      setIsAdminView(window.location.hash === '#admin' || window.location.search.includes('admin=true'));
    };
    checkAdminRoute();
    window.addEventListener('hashchange', checkAdminRoute);
    return () => window.removeEventListener('hashchange', checkAdminRoute);
  }, []);

  // Fetch Products from Express API (Evaluates custom prices server-side if customer logged in)
  const loadProducts = async () => {
    try {
      const token = localStorage.getItem('bst_agro_token');
      const data = await api.getProducts(token);
      if (Array.isArray(data)) {
        try {
          localStorage.setItem('bst_ecommerce_products_cache', JSON.stringify(data));
        } catch (e) {
          console.warn('Cache save warning:', e);
        }
        setProducts(prevProducts => {
          if (JSON.stringify(prevProducts) === JSON.stringify(data)) {
            return prevProducts;
          }
          return data;
        });
      }
    } catch (err) {
      console.warn('API unavailable, maintaining current catalog:', err);
    }
  };

  // Fetch Customers & Orders from Express API
  const loadAdminData = async () => {
    try {
      const [custData, ordData] = await Promise.all([
        api.getCustomers().catch(() => []),
        api.getOrders().catch(() => [])
      ]);
      if (Array.isArray(custData)) {
        setCustomers(prev => {
          if (JSON.stringify(prev) === JSON.stringify(custData)) return prev;
          return custData;
        });
      }
      if (Array.isArray(ordData)) {
        setOrders(prev => {
          if (JSON.stringify(prev) === JSON.stringify(ordData)) return prev;
          return ordData;
        });
      }
    } catch (err) {
      console.warn('Error loading admin data from backend API:', err);
    }
  };

  useEffect(() => {
    loadProducts();
    loadAdminData();
  }, [currentCustomer, isAdminView]);

  // Save Cart State Persistence
  useEffect(() => {
    localStorage.setItem('bst_ecommerce_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    if (!currentCustomer) {
      localStorage.removeItem('bst_ecommerce_active_customer');
      localStorage.removeItem('bst_agro_token');
    }
  }, [currentCustomer]);

  // Sync active customer details if updated
  useEffect(() => {
    if (currentCustomer) {
      const updated = customers.find(c => c.id === currentCustomer.id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(currentCustomer)) {
        setCurrentCustomer(updated);
      }
    }
  }, [customers, currentCustomer]);

  // Dynamic Available Brands derived from real-time products in database
  const availableBrands = useMemo(() => {
    const brandMap = new Map();

    // Always include "All Companies"
    brandMap.set('all', {
      id: "all",
      name: "All Companies",
      logoBadge: "🏢 All Brands",
      isOwnBrand: false,
      bgColor: "#056835",
      textColor: "#ffffff"
    });

    products.forEach(p => {
      if (!p.brand) return;
      const bId = p.brandId || p.brand.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!brandMap.has(bId)) {
        const preset = BRANDS.find(b => b.id === bId || b.name.toLowerCase() === p.brand.toLowerCase());
        if (preset) {
          brandMap.set(bId, preset);
        } else {
          brandMap.set(bId, {
            id: bId,
            name: p.brand,
            logoBadge: `🏢 ${p.brand}`,
            isOwnBrand: p.isOwnBrand || p.brand.toLowerCase().includes('bst'),
            bgColor: "#056835",
            textColor: "#ffffff",
            description: `${p.brand} Products`
          });
        }
      }
    });

    return Array.from(brandMap.values());
  }, [products]);

  // Dynamic Available Categories derived from real-time products in database
  const availableCategories = useMemo(() => {
    const catsSet = new Set(['All Categories']);
    products.forEach(p => {
      if (p.category && p.category.trim() !== '') {
        catsSet.add(p.category.trim());
      }
    });
    return Array.from(catsSet);
  }, [products]);

  // Reset selected filters if selected item is no longer present
  useEffect(() => {
    if (selectedBrand !== 'all' && !availableBrands.some(b => b.id === selectedBrand)) {
      setSelectedBrand('all');
    }
  }, [availableBrands, selectedBrand]);

  useEffect(() => {
    if (selectedCategory !== 'All Categories' && !availableCategories.includes(selectedCategory)) {
      setSelectedCategory('All Categories');
    }
  }, [availableCategories, selectedCategory]);

  // Product Counts per Brand (for available brands)
  const productCounts = useMemo(() => {
    const counts = { all: products.length };
    availableBrands.forEach(b => {
      if (b.id !== 'all') {
        counts[b.id] = products.filter(p => p.brandId === b.id || p.brand === b.name).length;
      }
    });
    return counts;
  }, [products, availableBrands]);

  // Product Counts per Category (for available categories)
  const categoryCounts = useMemo(() => {
    const counts = { 'All Categories': products.length };
    availableCategories.forEach(cat => {
      if (cat !== 'All Categories') {
        counts[cat] = products.filter(p => p.category === cat).length;
      }
    });
    return counts;
  }, [products, availableCategories]);

  // Selected Brand Object
  const selectedBrandObj = useMemo(() => {
    return availableBrands.find(b => b.id === selectedBrand);
  }, [availableBrands, selectedBrand]);

  // Filtered Products List
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (selectedBrand !== 'all') {
        const matchesId = p.brandId === selectedBrand;
        const matchesName = selectedBrandObj && p.brand === selectedBrandObj.name;
        if (!matchesId && !matchesName) return false;
      }
      if (selectedCategory !== 'All Categories' && p.category !== selectedCategory) return false;
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const matchName = p.name.toLowerCase().includes(query);
        const matchBrand = p.brand.toLowerCase().includes(query);
        const matchCat = p.category.toLowerCase().includes(query);
        const matchDesc = p.description ? p.description.toLowerCase().includes(query) : false;
        return matchName || matchBrand || matchCat || matchDesc;
      }
      return true;
    });
  }, [products, selectedBrand, selectedCategory, searchTerm, selectedBrandObj]);

  // Cart Actions
  const handleAddToCart = (product) => {
    const effectivePrice = getEffectivePrice(product, currentCustomer);
    setCartItems(prev => {
      const exists = prev.find(item => item.id === product.id);
      if (exists) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1, price: effectivePrice } : item);
      }
      return [...prev, { ...product, price: effectivePrice, qty: 1 }];
    });
  };

  const handleUpdateQty = (id, newQty) => {
    if (newQty <= 0) {
      handleRemoveItem(id);
    } else {
      setCartItems(prev => prev.map(item => item.id === id ? { ...item, qty: newQty } : item));
    }
  };

  const handleRemoveItem = (id) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // Admin Actions via Express API
  const handleUpdateCustomerCustomPrice = async (customerId, productId, newPrice) => {
    try {
      await api.updateCustomerCustomPrice(customerId, productId, newPrice);
      await Promise.all([loadAdminData(), loadProducts()]);
    } catch (err) {
      console.error('Error updating customer custom price:', err);
    }
  };

  const handleAddCustomer = async (newCustomer) => {
    try {
      await api.addCustomer(newCustomer);
      await loadAdminData();
    } catch (err) {
      console.error('Error adding customer account:', err);
    }
  };

  const handleUpdateBasePrice = async (productId, newPrice) => {
    try {
      await api.updateBasePrice(productId, newPrice);
      await loadProducts();
    } catch (err) {
      console.error('Error updating base price:', err);
    }
  };

  const handleRecordNewOrder = async (orderData) => {
    try {
      const res = await api.createOrder(orderData);
      if (res.order) {
        setOrders(prev => [res.order, ...prev]);
      }
    } catch (err) {
      console.error('Error logging order:', err);
    }
  };

  // Admin: Add New Product
  const handleAddProduct = async (productData) => {
    try {
      await api.createProduct(productData);
      await loadProducts();
    } catch (err) {
      console.error('Error creating product:', err);
    }
  };

  // Admin: Update Existing Product
  const handleUpdateProduct = async (productId, productData) => {
    try {
      await api.updateProduct(productId, productData);
      await loadProducts();
    } catch (err) {
      console.error('Error updating product:', err);
    }
  };

  // Admin: Delete Product
  const handleDeleteProduct = async (productId) => {
    // Optimistically remove from local state immediately
    setProducts(prev => {
      const filtered = prev.filter(p => p.id !== productId);
      try {
        localStorage.setItem('bst_ecommerce_products_cache', JSON.stringify(filtered));
      } catch {}
      return filtered;
    });

    try {
      await api.deleteProduct(productId);
      // Delay background sync so UI doesn't flicker/reappear before server confirms
      setTimeout(() => loadProducts(), 1500);
    } catch (err) {
      console.error('Error deleting product:', err);
      // Restore product list on failure
      await loadProducts();
      throw err; // re-throw so Admin page can show proper toast error
    }
  };


  const cartCount = cartItems.reduce((sum, item) => sum + item.qty, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const bstPaneerItem = products.find(p => p.id === 'bst-paneer-1kg') || 
                        products.find(p => (p.brandId === 'bst' || (p.brand && p.brand.toLowerCase().includes('bst'))) && p.name.toLowerCase().includes('paneer')) || 
                        products.find(p => p.brandId === 'bst' || (p.brand && p.brand.toLowerCase().includes('bst'))) || 
                        products[0] || null;
  const bstPaneerPrice = bstPaneerItem ? getEffectivePrice(bstPaneerItem, currentCustomer) : 250;

  const handleLogoutCustomer = () => {
    setCurrentCustomer(null);
    setCartItems([]);
    localStorage.removeItem('bst_ecommerce_cart');
    localStorage.removeItem('bst_agro_token');
    localStorage.removeItem('bst_ecommerce_active_customer');
  };

  if (isAdminView) {
    return (
      <AdminDashboardPage 
        customers={customers}
        products={products}
        orders={orders}
        onUpdateCustomerCustomPrice={handleUpdateCustomerCustomPrice}
        onAddCustomer={handleAddCustomer}
        onUpdateBasePrice={handleUpdateBasePrice}
        onAddProduct={handleAddProduct}
        onUpdateProduct={handleUpdateProduct}
        onDeleteProduct={handleDeleteProduct}
        onRefreshAdminData={loadAdminData}
        onRefreshProducts={loadProducts}
        onBackToStore={() => {
          localStorage.removeItem('bst_agro_admin_token');
          window.location.hash = '';
          setIsAdminView(false);
        }}
      />
    );
  }

  return (
    <div className="app-wrapper">
      {/* Customer Helpline & Top Hotline Bar */}
      <DeliveryTopBar />

      {/* Main E-Commerce Header */}
      <Navbar 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        cartCount={cartCount}
        cartTotal={cartTotal}
        onOpenCart={() => setIsCartOpen(true)}
        currentCustomer={currentCustomer}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogoutCustomer={handleLogoutCustomer}
      />

      {/* Company Brand Navigation Strip */}
      <BrandNavStrip 
        selectedBrand={selectedBrand}
        setSelectedBrand={setSelectedBrand}
        productCounts={productCounts}
        brands={availableBrands}
      />

      {/* Hero Banner */}
      <HeroBanner 
        onOpenWholesaleModal={() => setIsWholesaleModalOpen(true)}
        setSelectedBrand={setSelectedBrand}
        featuredProduct={bstPaneerItem}
        featuredPrice={bstPaneerPrice}
        onAddToCart={handleAddToCart}
      />

      {/* Main E-Commerce Layout */}
      <div className="layout-container">
        
        {/* Left Category Sidebar */}
        <CategorySidebar 
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          categoryCounts={categoryCounts}
          categories={availableCategories}
        />

        {/* Right Main Content */}
        <main>
          {/* BST Paneer Main Company Feature Card (Show when default view and product exists) */}
          {selectedBrand === 'all' && selectedCategory === 'All Categories' && !searchTerm && bstPaneerItem && (
            <div className="bst-flagship-spotlight">
              <div className="spotlight-left">
                <div className="spotlight-tag">
                  ⭐ OUR COMPANY's #1 MAIN PRODUCT
                </div>
                <h2>BST Fresh Cottage Paneer</h2>
                <p>
                  100% Pure milk cottage paneer manufactured directly at BST Agro & Dairy factory. Guaranteed super soft texture, rich aroma, and authentic taste.
                </p>
                <div className="spotlight-meta-pills">
                  <span>🟢 100% Pure Fresh</span>
                  <span>📦 1kg & 5kg Packs</span>
                  <span>⚡ Same-Day Factory Dispatch</span>
                </div>
                <div className="spotlight-actions">
                  <button 
                    onClick={() => handleAddToCart(bstPaneerItem)}
                    className="spotlight-add-btn"
                  >
                    🛒 Add BST Paneer 1kg (₹{bstPaneerPrice})
                  </button>
                  <a 
                    href={"https://wa.me/919949694030?text=" + encodeURIComponent(`Hello Bhaskar Reddy, order request from *${currentCustomer ? currentCustomer.shopName : 'Customer'}* for BST Fresh Cottage Paneer.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="spotlight-wa-btn"
                  >
                    💬 Order via WhatsApp
                  </a>
                </div>
              </div>
              <div className="spotlight-right">
                <img 
                  src="/bst-paneer.png" 
                  alt="BST Cottage Paneer Packet" 
                  className="spotlight-img"
                />
              </div>
            </div>
          )}

          {/* Active Brand Banner if filtered */}
          {selectedBrand !== 'all' && selectedBrandObj && (
            <div className="active-brand-banner">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.3rem' }}>{selectedBrandObj.logoBadge}</span>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#0F172A' }}>
                    {selectedBrandObj.name} Products
                  </h3>
                </div>
                <p style={{ fontSize: '0.88rem', color: '#64748B', marginTop: '3px' }}>
                  {selectedBrandObj.description}
                </p>
              </div>

              <button 
                onClick={() => setSelectedBrand('all')}
                className="show-all-brands-btn"
              >
                <RefreshCw size={14} />
                <span>Show All Products</span>
              </button>
            </div>
          )}

          {/* Active Filter Indicator Bar */}
          {(searchTerm || selectedBrand !== 'all' || selectedCategory !== 'All Categories') && (
            <div className="active-filter-bar">
              <div>
                Showing <strong>{filteredProducts.length}</strong> items
                {selectedBrand !== 'all' && <span> • Brand: <strong>{selectedBrandObj?.name}</strong></span>}
                {selectedCategory !== 'All Categories' && <span> • Category: <strong>{selectedCategory}</strong></span>}
                {searchTerm && <span> • Search: "<strong>{searchTerm}</strong>"</span>}
              </div>

              <button 
                onClick={() => { setSearchTerm(''); setSelectedBrand('all'); setSelectedCategory('All Categories'); }}
                className="clear-filter-btn"
              >
                Clear All Filters
              </button>
            </div>
          )}

          {/* Products List: Grouped by Expandable Company Name Rows when All Brands is selected */}
          {filteredProducts.length > 0 ? (
            selectedBrand === 'all' ? (
              <BrandAccordionSection 
                filteredProducts={filteredProducts}
                cartItems={cartItems}
                handleAddToCart={handleAddToCart}
                handleUpdateQty={handleUpdateQty}
                setQuickViewProduct={setQuickViewProduct}
                currentCustomer={currentCustomer}
                selectedCategory={selectedCategory}
                searchTerm={searchTerm}
                brands={availableBrands}
              />
            ) : (
              <div className="product-grid">
                {filteredProducts.map(product => {
                  const inCart = cartItems.find(item => item.id === product.id);
                  return (
                    <ProductCard 
                      key={product.id}
                      product={product}
                      cartQty={inCart ? inCart.qty : 0}
                      onAddToCart={handleAddToCart}
                      onUpdateQty={handleUpdateQty}
                      onQuickView={setQuickViewProduct}
                      currentCustomer={currentCustomer}
                    />
                  );
                })}
              </div>
            )
          ) : (
            <div className="no-products-box">
              <AlertCircle size={48} color="#056835" style={{ margin: '0 auto 0.85rem' }} />
              <h3>No products found</h3>
              <p>Try clearing your search term or choosing "All Categories".</p>
              <button 
                onClick={() => { setSearchTerm(''); setSelectedBrand('all'); setSelectedCategory('All Categories'); }}
                className="view-all-btn"
              >
                View All Products
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <Footer />

      {/* Quick View Modal */}
      {quickViewProduct && (
        <ProductDetailModal 
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
          onAddToCart={handleAddToCart}
          cartQty={cartItems.find(item => item.id === quickViewProduct.id)?.qty || 0}
          onUpdateQty={handleUpdateQty}
        />
      )}

      {/* Cart Drawer */}
      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        currentCustomer={currentCustomer}
        onRecordNewOrder={handleRecordNewOrder}
      />

      {/* Wholesale Modal */}
      <WholesaleModal 
        isOpen={isWholesaleModalOpen}
        onClose={() => setIsWholesaleModalOpen(false)}
      />

      {/* Shop Auth Login/Registration Modal */}
      <ShopAuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        customers={customers}
        onLoginSuccess={(customer) => setCurrentCustomer(customer)}
        onRegisterNewCustomer={handleAddCustomer}
      />

      {/* Site-Wide Floating WhatsApp Chat Widget */}
      <FloatingWhatsAppBtn />
    </div>
  );
}

export default App;
