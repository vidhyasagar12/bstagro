import React, { useState, useEffect } from 'react';
import { X, Lock, ShieldCheck, Building2, Package, ShoppingBag, Plus, Save, Edit3, MessageCircle, Send, CheckCircle2, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

export const generatePriceUpdateNotificationLink = (phone, ownerName, shopName, productName, newPrice, oldPrice) => {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  const greeting = ownerName ? `Hello *${ownerName}* (Owner of *${shopName}*),` : `Hello *${shopName}*,`;

  const message = `📢 *PRICE UPDATE NOTIFICATION - BST AGRO & DAIRY*

${greeting}

We have updated your special wholesale price rate:
📦 *Product*: ${productName}
💰 *New Updated Price*: ₹${newPrice} per unit ${oldPrice !== undefined ? `(Previous: ₹${oldPrice})` : ''}

Log in to your shop portal at BST Agro & Dairy with your registered phone number to view your updated rates and place your orders!

📞 Hotline & Order Support: +91 99496 94030
BST Agro & Dairy Foods`;

  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
};

export const generateAllPricesSummaryLink = (phone, ownerName, shopName, products, customPrices) => {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  const greeting = ownerName ? `Hello *${ownerName}* (Owner of *${shopName}*),` : `Hello *${shopName}*,`;

  let priceListStr = products.map(p => {
    const rate = customPrices && customPrices[p.id] !== undefined ? customPrices[p.id] : p.price;
    return `• ${p.name} (${p.packSize}): *₹${rate}*`;
  }).join('\n');

  const message = `📋 *UPDATED PRICE LIST FOR ${shopName.toUpperCase()}*

${greeting}

Here are your updated wholesale rates from BST Agro & Dairy Foods:

${priceListStr}

Visit your shop portal to place orders anytime!
📞 Contact: +91 99496 94030
BST Agro & Dairy`;

  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
};

export const AdminPanelModal = ({ 
  isOpen, 
  onClose, 
  customers, 
  products, 
  orders, 
  onUpdateCustomerCustomPrice, 
  onAddCustomer, 
  onUpdateBasePrice,
  onUpdateOrderStatus,
  onRefreshAdminData
}) => {
  const [adminPin, setAdminPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinError, setPinError] = useState('');
  const [adminTab, setAdminTab] = useState('customers'); // 'customers' | 'orders' | 'prices'
  const [isSyncing, setIsSyncing] = useState(false);

  // Selected Customer for Editing Custom Pricing
  const [editingCustomer, setEditingCustomer] = useState(null);

  // Track recent price updates for notification feedback
  const [lastUpdatedProduct, setLastUpdatedProduct] = useState(null);

  // New Customer Form State (Manual Add by Admin)
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustData, setNewCustData] = useState({
    shopName: '',
    ownerName: '',
    phone: '',
    pin: '1234',
    businessType: 'Restaurant / Hotel',
    address: ''
  });

  // Automated Real-Time Background Polling for Live Order Updates (Every 3 seconds)
  useEffect(() => {
    if (!isOpen || !isAuthenticated || !onRefreshAdminData) return;

    // Fetch immediately on open / tab switch
    onRefreshAdminData();

    // Poll live every 3 seconds for instant order updates without manual refresh
    const timer = setInterval(() => {
      onRefreshAdminData();
    }, 3000);

    return () => clearInterval(timer);
  }, [isOpen, isAuthenticated, adminTab, onRefreshAdminData]);

  if (!isOpen) return null;

  const handleAdminPinSubmit = async (e) => {
    e.preventDefault();
    setPinError('');

    try {
      const data = await api.verifyAdmin(adminPin);
      if (data.token) {
        localStorage.setItem('bst_agro_admin_token', data.token);
      }
      setIsAuthenticated(true);
      setPinError('');
    } catch (err) {
      setPinError(err.message || 'Invalid Admin PIN. Please enter your valid Admin PIN.');
    }
  };

  // Plain Text Custom Price Change Handler (Non-negative)
  const handleCustomPriceChange = (productId, rawVal) => {
    if (!editingCustomer) return;
    
    if (rawVal === '') {
      const updated = { ...(editingCustomer.customPrices || {}) };
      delete updated[productId];
      onUpdateCustomerCustomPrice(editingCustomer.id, productId, undefined);
      setEditingCustomer(prev => ({
        ...prev,
        customPrices: updated
      }));
      setLastUpdatedProduct(productId);
      return;
    }

    const cleanStr = rawVal.replace(/[^0-9.]/g, '');
    const priceNum = Math.max(0, parseFloat(cleanStr) || 0);

    onUpdateCustomerCustomPrice(editingCustomer.id, productId, priceNum);
    setEditingCustomer(prev => ({
      ...prev,
      customPrices: {
        ...(prev.customPrices || {}),
        [productId]: priceNum
      }
    }));
    setLastUpdatedProduct(productId);
  };

  // Plain Text Base Price Change Handler (Non-negative)
  const handleBasePriceChange = (productId, rawVal) => {
    const cleanStr = rawVal.replace(/[^0-9.]/g, '');
    const priceNum = Math.max(0, parseFloat(cleanStr) || 0);
    onUpdateBasePrice(productId, priceNum);
    setLastUpdatedProduct(productId);
  };

  const handleAddCustomerSubmit = (e) => {
    e.preventDefault();
    if (!newCustData.shopName || !newCustData.ownerName || !newCustData.phone) return;

    const newCust = {
      id: `cust-${Date.now()}`,
      ...newCustData,
      customPrices: {}
    };

    onAddCustomer(newCust);
    setShowAddCustomerModal(false);
    setNewCustData({ shopName: '', ownerName: '', phone: '', pin: '1234', businessType: 'Restaurant / Hotel', address: '' });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '940px', width: '96%', maxHeight: '92vh' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid #E2E8F0', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShieldCheck size={26} color="#056835" />
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '900', color: '#0F172A' }}>BST Agro Admin Control Center</h2>
              <p style={{ fontSize: '0.78rem', color: '#64748B' }}>Customer Pricing & Automated WhatsApp Price Notifications</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: '#E2E8F0', padding: '6px', borderRadius: '50%' }}>
            <X size={20} color="#0F172A" />
          </button>
        </div>

        {!isAuthenticated ? (
          /* Security PIN Screen */
          <div style={{ maxWidth: '400px', margin: '2rem auto', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <Lock size={28} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#0F172A', marginBottom: '0.4rem' }}>Admin Security Verification</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '1.5rem' }}>Enter Admin Passcode to manage customer pricing and send WhatsApp notifications.</p>

            <form onSubmit={handleAdminPinSubmit}>
              <input 
                type="password" 
                className="form-input" 
                style={{ textAlign: 'center', fontSize: '1.2rem', fontWeight: '900', letterSpacing: '4px', padding: '0.75rem', marginBottom: '1rem' }}
                placeholder="Enter Admin PIN"
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value)}
                autoFocus
              />
              {pinError && <p style={{ color: '#EF4444', fontSize: '0.82rem', fontWeight: '800', marginBottom: '1rem' }}>{pinError}</p>}
              <button type="submit" style={{ width: '100%', background: '#056835', color: '#fff', padding: '0.8rem', borderRadius: '10px', fontWeight: '900', fontSize: '0.95rem' }}>
                Verify & Unlock Admin Panel
              </button>
            </form>
          </div>
        ) : (
          /* Main Admin Interface */
          <div>
            {/* Navigation Tabs */}
            <div style={{ display: 'flex', gap: '0.6rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem', marginBottom: '1.25rem', overflowX: 'auto' }}>
              <button 
                onClick={() => { setAdminTab('customers'); setEditingCustomer(null); }}
                style={{
                  padding: '0.55rem 1.1rem',
                  borderRadius: '8px',
                  fontWeight: '800',
                  fontSize: '0.88rem',
                  background: adminTab === 'customers' ? '#056835' : '#F1F5F9',
                  color: adminTab === 'customers' ? '#ffffff' : '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <Building2 size={16} />
                <span>Shop Accounts & Custom Pricing ({customers.length})</span>
              </button>

              <button 
                onClick={() => { setAdminTab('orders'); setEditingCustomer(null); }}
                style={{
                  padding: '0.55rem 1.1rem',
                  borderRadius: '8px',
                  fontWeight: '800',
                  fontSize: '0.88rem',
                  background: adminTab === 'orders' ? '#056835' : '#F1F5F9',
                  color: adminTab === 'orders' ? '#ffffff' : '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <ShoppingBag size={16} />
                <span>Order History ({orders.length})</span>
              </button>

              <button 
                onClick={() => { setAdminTab('prices'); setEditingCustomer(null); }}
                style={{
                  padding: '0.55rem 1.1rem',
                  borderRadius: '8px',
                  fontWeight: '800',
                  fontSize: '0.88rem',
                  background: adminTab === 'prices' ? '#056835' : '#F1F5F9',
                  color: adminTab === 'prices' ? '#ffffff' : '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <Package size={16} />
                <span>Base Store Prices</span>
              </button>
            </div>

            {/* TAB 1: SHOP ACCOUNTS & CUSTOM PRICING */}
            {adminTab === 'customers' && (
              <div>
                {!editingCustomer ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: '900', color: '#0F172A' }}>Registered Shops & Hotels</h3>
                      <button 
                        onClick={() => setShowAddCustomerModal(true)}
                        style={{ background: '#056835', color: '#fff', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: '800', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                      >
                        <Plus size={16} />
                        <span>Add New Shop Account</span>
                      </button>
                    </div>

                    <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left' }}>
                        <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: '800' }}>
                          <tr>
                            <th style={{ padding: '0.75rem 1rem' }}>Shop / Hotel Name</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Owner & Contact</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Security PIN</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Business Type</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>WhatsApp & Pricing Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {customers.map((c) => {
                            const customCount = Object.keys(c.customPrices || {}).length;
                            const summaryWaUrl = generateAllPricesSummaryLink(c.phone, c.ownerName, c.shopName, products, c.customPrices);

                            return (
                              <tr key={c.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                <td style={{ padding: '0.85rem 1rem', fontWeight: '800', color: '#0F172A' }}>
                                  🏢 {c.shopName}
                                  {customCount > 0 && (
                                    <div style={{ fontSize: '0.72rem', color: '#056835', fontWeight: '700', marginTop: '2px' }}>
                                      ⭐ {customCount} custom prices configured
                                    </div>
                                  )}
                                </td>
                                <td style={{ padding: '0.85rem 1rem', color: '#475569' }}>
                                  <div><strong>{c.ownerName}</strong></div>
                                  <div style={{ fontSize: '0.8rem', color: '#64748B' }}>📞 {c.phone}</div>
                                </td>
                                <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontWeight: '800', color: '#D97706' }}>
                                  {c.pin || '1234'}
                                </td>
                                <td style={{ padding: '0.85rem 1rem', color: '#64748B', fontSize: '0.82rem' }}>
                                  {c.businessType}
                                </td>
                                <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                                  <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                                    <a
                                      href={summaryWaUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{ background: '#25D366', color: '#ffffff', padding: '0.4rem 0.75rem', borderRadius: '6px', fontWeight: '800', fontSize: '0.78rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                                      title="Send full WhatsApp price sheet to this customer"
                                    >
                                      <MessageCircle size={14} />
                                      <span>Notify Rates via WA</span>
                                    </a>

                                    <button 
                                      onClick={() => setEditingCustomer(c)}
                                      style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FCD34D', padding: '0.4rem 0.75rem', borderRadius: '6px', fontWeight: '800', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                                    >
                                      <Edit3 size={14} />
                                      <span>Edit Prices</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  /* Edit Custom Pricing Screen for Selected Customer */
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div>
                        <span style={{ fontSize: '0.78rem', color: '#056835', fontWeight: '900', textTransform: 'uppercase' }}>Setting Custom Prices & Notifications for:</span>
                        <h3 style={{ fontSize: '1.3rem', fontWeight: '900', color: '#0F172A' }}>🏢 {editingCustomer.shopName}</h3>
                        <p style={{ fontSize: '0.82rem', color: '#64748B' }}>Owner: {editingCustomer.ownerName} • Phone: <strong>{editingCustomer.phone}</strong></p>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <a
                          href={generateAllPricesSummaryLink(editingCustomer.phone, editingCustomer.ownerName, editingCustomer.shopName, products, editingCustomer.customPrices)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ background: '#25D366', color: '#fff', padding: '0.45rem 0.95rem', borderRadius: '6px', fontWeight: '800', fontSize: '0.82rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                        >
                          <Send size={15} />
                          <span>📢 Send Full Rate List on WhatsApp</span>
                        </a>

                        <button 
                          onClick={() => setEditingCustomer(null)}
                          style={{ background: '#0F172A', color: '#fff', padding: '0.45rem 0.95rem', borderRadius: '6px', fontWeight: '800', fontSize: '0.82rem' }}
                        >
                          ← Back to Shops
                        </button>
                      </div>
                    </div>

                    <div style={{ background: '#DCFCE7', border: '1px solid #86EFAC', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.85rem', color: '#14532D', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <MessageCircle size={18} color="#16A34A" />
                      <span>
                        <strong>Automated WhatsApp Notifications:</strong> Change any item price below. Click the green <strong>"💬 Notify via WA"</strong> button to send an instant price update alert directly to <strong>{editingCustomer.shopName}'s WhatsApp ({editingCustomer.phone})</strong>!
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
                      {products.map((p) => {
                        const currentCustom = editingCustomer.customPrices ? editingCustomer.customPrices[p.id] : undefined;
                        const isSet = currentCustom !== undefined;
                        const activePrice = isSet ? currentCustom : p.price;
                        const notifyUrl = generatePriceUpdateNotificationLink(editingCustomer.phone, editingCustomer.ownerName, editingCustomer.shopName, p.name, activePrice, p.price);

                        return (
                          <div key={p.id} style={{ background: '#ffffff', border: isSet ? '2px solid #056835' : '1px solid #E2E8F0', padding: '0.95rem', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                <h4 style={{ fontSize: '0.92rem', fontWeight: '900', color: '#0F172A' }}>{p.name}</h4>
                                <div style={{ fontSize: '0.78rem', color: '#64748B' }}>Store Base Price: <strong>₹{p.price}</strong></div>
                              </div>
                              {isSet && (
                                <span style={{ background: '#E6F4ED', color: '#056835', fontSize: '0.68rem', fontWeight: '900', padding: '2px 7px', borderRadius: '4px' }}>
                                  CUSTOM RATE ACTIVE
                                </span>
                              )}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '0.72rem', color: '#056835', fontWeight: '800', display: 'block', marginBottom: '2px' }}>
                                  {isSet ? '⭐ Special Price for Shop (₹)' : 'Special Price for Shop (₹)'}
                                </label>
                                <input 
                                  type="text" 
                                  inputMode="decimal"
                                  className="form-input" 
                                  style={{ padding: '0.45rem', fontWeight: '900', fontSize: '1rem', color: isSet ? '#056835' : '#0F172A' }}
                                  placeholder={`Base ₹${p.price}`}
                                  value={currentCustom !== undefined ? currentCustom : ''}
                                  onChange={(e) => handleCustomPriceChange(p.id, e.target.value)}
                                />
                              </div>

                              {/* Instant WhatsApp Notification Button for this specific product */}
                              <a
                                href={notifyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  background: '#25D366',
                                  color: '#ffffff',
                                  padding: '0.5rem 0.75rem',
                                  borderRadius: '8px',
                                  fontWeight: '800',
                                  fontSize: '0.78rem',
                                  textDecoration: 'none',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  boxShadow: '0 2px 6px rgba(37, 211, 102, 0.3)',
                                  marginTop: '1rem'
                                }}
                                title={`Send WhatsApp price change notification to ${editingCustomer.shopName}`}
                              >
                                <MessageCircle size={15} />
                                <span>Notify WA</span>
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: ORDER HISTORY */}
            {adminTab === 'orders' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: '900', color: '#0F172A' }}>Submitted Customer Orders</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '2px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 8px #22C55E' }}></span>
                      <span style={{ fontSize: '0.78rem', color: '#056835', fontWeight: '800' }}>Live Dynamic Auto-Sync (Real-Time 3s)</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      setIsSyncing(true);
                      if (onRefreshAdminData) {
                        onRefreshAdminData().finally(() => setIsSyncing(false));
                      } else {
                        setIsSyncing(false);
                      }
                    }}
                    style={{ background: '#E6F4ED', color: '#056835', border: '1px solid rgba(5,104,53,0.3)', padding: '0.45rem 0.9rem', borderRadius: '8px', fontWeight: '800', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
                  >
                    <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
                    <span>Refresh Orders Now</span>
                  </button>
                </div>

                {orders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: '#64748B', background: '#F8FAFC', borderRadius: '10px' }}>
                    <ShoppingBag size={44} color="#CBD5E1" style={{ margin: '0 auto 0.5rem' }} />
                    <p style={{ fontWeight: '700' }}>No orders logged in system yet.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {orders.map((ord, idx) => {
                      const orderWaUrl = `https://wa.me/${ord.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello *${ord.shopName}*, regarding your order total ₹${ord.totalAmount}: Your order is confirmed and being processed by BST Agro & Dairy.`)}`;

                      return (
                        <div key={ord.id || idx} style={{ background: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '1rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.65rem', marginBottom: '0.65rem' }}>
                            <div>
                              <h4 style={{ fontSize: '1.05rem', fontWeight: '900', color: '#0F172A' }}>🏢 {ord.shopName}</h4>
                              <div style={{ fontSize: '0.8rem', color: '#64748B' }}>Contact: {ord.ownerName} ({ord.phone}) • Address: {ord.address}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '1.15rem', fontWeight: '900', color: '#056835' }}>₹{Math.max(0, ord.totalAmount || 0).toLocaleString()}</div>
                              <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', marginTop: '4px' }}>
                                <a
                                  href={orderWaUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ background: '#25D366', color: '#fff', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '800', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                                >
                                  <MessageCircle size={12} />
                                  <span>WhatsApp Customer</span>
                                </a>
                              </div>
                            </div>
                          </div>

                          {/* Order Items Table */}
                          <div style={{ fontSize: '0.82rem', color: '#475569' }}>
                            <strong>Order Items:</strong>
                            <ul style={{ listStyle: 'none', paddingLeft: 0, marginTop: '0.35rem' }}>
                              {ord.items && ord.items.map((it, i) => (
                                <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                                  <span>• {it.name} ({it.packSize}) x {it.qty}</span>
                                  <span>₹{Math.max(0, it.price || 0)} x {it.qty} = <strong>₹{Math.max(0, (it.price || 0) * it.qty)}</strong></span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: BASE PRICES */}
            {adminTab === 'prices' && (
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '900', color: '#0F172A', marginBottom: '1rem' }}>Store Base Product Prices</h3>
                <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '1.25rem' }}>
                  Update standard base catalog prices. Click <strong>"📢 Notify Customers"</strong> to send price update alerts to registered shops.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                  {products.map(p => (
                    <div key={p.id} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.95rem', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#0F172A' }}>{p.name}</h4>
                          <div style={{ fontSize: '0.78rem', color: '#64748B' }}>{p.brand} • {p.packSize}</div>
                        </div>
                        <div style={{ width: '95px' }}>
                          <label style={{ fontSize: '0.7rem', color: '#056835', fontWeight: '800', display: 'block' }}>Base Price (₹)</label>
                          <input 
                            type="text" 
                            inputMode="decimal"
                            className="form-input" 
                            style={{ padding: '0.35rem', fontWeight: '900', fontSize: '0.95rem' }}
                            value={p.price}
                            onChange={(e) => handleBasePriceChange(p.id, e.target.value)}
                          />
                        </div>
                      </div>

                      {/* WhatsApp Notify Quick Action for Base Price Update */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px dashed #CBD5E1', paddingTop: '0.5rem' }}>
                        <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '700' }}>Send Price Alert:</span>
                        <div style={{ display: 'flex', gap: '0.3rem' }}>
                          {customers.slice(0, 3).map(c => (
                            <a
                              key={c.id}
                              href={generatePriceUpdateNotificationLink(c.phone, c.ownerName, c.shopName, p.name, p.price)}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ background: '#DCFCE7', color: '#15803D', padding: '2px 6px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: '800', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '2px' }}
                              title={`Notify ${c.shopName} on WhatsApp`}
                            >
                              <MessageCircle size={10} />
                              <span>{c.shopName.split(' ')[0]}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal: Add New Shop Account (Admin Manual Add) */}
        {showAddCustomerModal && (
          <div className="modal-overlay" style={{ zIndex: 3000 }}>
            <div className="modal-card" style={{ maxWidth: '440px', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '900', color: '#0F172A' }}>Add New Shop Account</h3>
                <button onClick={() => setShowAddCustomerModal(false)} style={{ background: '#E2E8F0', padding: '4px', borderRadius: '50%' }}>
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleAddCustomerSubmit}>
                <div className="form-group">
                  <label>Hotel / Shop Name *</label>
                  <input type="text" className="form-input" required value={newCustData.shopName} onChange={(e) => setNewCustData({...newCustData, shopName: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Owner Name *</label>
                  <input type="text" className="form-input" required value={newCustData.ownerName} onChange={(e) => setNewCustData({...newCustData, ownerName: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input type="text" className="form-input" required value={newCustData.phone} onChange={(e) => setNewCustData({...newCustData, phone: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Set 4-Digit Security PIN *</label>
                  <input type="text" maxLength={4} className="form-input" required value={newCustData.pin} onChange={(e) => setNewCustData({...newCustData, pin: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Full Address</label>
                  <textarea className="form-input" rows="2" value={newCustData.address} onChange={(e) => setNewCustData({...newCustData, address: e.target.value})}></textarea>
                </div>
                <button type="submit" style={{ width: '100%', background: '#056835', color: '#fff', padding: '0.75rem', borderRadius: '8px', fontWeight: '900' }}>
                  Save Shop Account
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
