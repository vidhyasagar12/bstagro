import React, { useState, useEffect } from 'react';
import { ShieldCheck, Building2, Package, ShoppingBag, Plus, Save, Edit3, MessageCircle, Send, Lock, LogOut, ArrowLeft, RefreshCw, X, CheckCircle2 } from 'lucide-react';
import { Logo } from '../components/Logo';
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

export const playOrderAlertSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, ctx.currentTime);
    gain1.gain.setValueAtTime(0.3, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.4);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1320, ctx.currentTime + 0.15);
    gain2.gain.setValueAtTime(0.35, ctx.currentTime + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.15);
    osc2.stop(ctx.currentTime + 0.6);
  } catch (err) {
    console.warn('Audio alert sound failed:', err);
  }
};

export const requestDesktopNotificationPermission = async () => {
  if (!('Notification' in window)) {
    alert('This browser does not support desktop notifications.');
    return false;
  }
  const perm = await Notification.requestPermission();
  return perm === 'granted';
};

export const triggerDesktopNotification = (shopName, totalAmount, itemsCount) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification('🔔 NEW ORDER RECEIVED! - BST Agro', {
        body: `🏢 ${shopName}\n💰 Total: ₹${totalAmount.toLocaleString()}\n📦 ${itemsCount} Item(s) placed`,
        icon: '/bst-paneer.png',
        tag: `order-${Date.now()}`
      });
    } catch (e) {
      console.warn('Notification trigger failed:', e);
    }
  }
};

export const AdminDashboardPage = ({ 
  customers, 
  products, 
  orders, 
  onUpdateCustomerCustomPrice, 
  onAddCustomer, 
  onUpdateBasePrice,
  onRefreshAdminData,
  onBackToStore
}) => {
  const [adminPin, setAdminPin] = useState('');
  
  // Require Admin PIN login every time the page/tab is accessed
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Clear admin session on component unmount (tab switch / navigation away)
  useEffect(() => {
    return () => {
      localStorage.removeItem('bst_agro_admin_token');
    };
  }, []);

  const [pinError, setPinError] = useState('');
  const [adminTab, setAdminTab] = useState('customers'); // 'customers' | 'orders' | 'prices'
  const [isSyncing, setIsSyncing] = useState(false);

  // Selected Customer for Editing Custom Pricing
  const [editingCustomer, setEditingCustomer] = useState(null);

  // New Customer Form State
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
    if (!isAuthenticated || !onRefreshAdminData) return;

    onRefreshAdminData();

    const timer = setInterval(() => {
      onRefreshAdminData();
    }, 3000);

    return () => clearInterval(timer);
  }, [isAuthenticated, adminTab, onRefreshAdminData]);

  const knownOrderIdsRef = React.useRef(null);
  const [notificationPermission, setNotificationPermission] = useState(() => {
    return 'Notification' in window ? Notification.permission : 'default';
  });

  // Sound & Desktop Notification Trigger on New Order Arrival
  useEffect(() => {
    if (!orders || orders.length === 0) return;

    if (knownOrderIdsRef.current === null) {
      knownOrderIdsRef.current = new Set(orders.map(o => o.id));
      return;
    }

    const newOrders = orders.filter(o => !knownOrderIdsRef.current.has(o.id));
    if (newOrders.length > 0) {
      // 1. Web Audio Sound Chime Alert
      playOrderAlertSound();

      // 2. Browser Native Desktop Notification Banner
      const latest = newOrders[0];
      triggerDesktopNotification(latest.shopName, latest.totalAmount, latest.items?.length || 0);

      newOrders.forEach(o => knownOrderIdsRef.current.add(o.id));
    }
  }, [orders]);

  const handleEnableNotifications = async () => {
    const granted = await requestDesktopNotificationPermission();
    if (granted) {
      setNotificationPermission('granted');
      triggerDesktopNotification('Sample Wholesale Order', 2450, 3);
    } else {
      setNotificationPermission('denied');
    }
  };

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

  const handleAdminLogout = () => {
    localStorage.removeItem('bst_agro_admin_token');
    setIsAuthenticated(false);
    setAdminPin('');
  };

  const handleBackToStore = () => {
    handleAdminLogout();
    if (onBackToStore) onBackToStore();
  };

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
  };

  const handleBasePriceChange = (productId, rawVal) => {
    const cleanStr = rawVal.replace(/[^0-9.]/g, '');
    const priceNum = Math.max(0, parseFloat(cleanStr) || 0);
    onUpdateBasePrice(productId, priceNum);
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
    <div style={{ minHeight: '100vh', background: '#F8FAFC', color: '#0F172A', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Standalone Admin Page Header */}
      <header style={{ background: '#ffffff', borderBottom: '1px solid #E2E8F0', padding: '1rem 2rem', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', sticky: 'top', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <Logo size={44} showText={true} />
            <div style={{ borderLeft: '2px solid #CBD5E1', paddingLeft: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShieldCheck size={20} color="#056835" />
                <h1 style={{ fontSize: '1.15rem', fontWeight: '900', color: '#0F172A' }}>Admin Management Center</h1>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#056835', fontWeight: '800' }}>🟢 Production SQLite Database Active</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <button 
              onClick={handleBackToStore}
              style={{ background: '#F1F5F9', color: '#0F172A', border: '1px solid #CBD5E1', padding: '0.55rem 1.1rem', borderRadius: '8px', fontWeight: '800', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
            >
              <ArrowLeft size={16} />
              <span>Back to Store View</span>
            </button>

            {isAuthenticated && (
              <>
                <button 
                  onClick={playOrderAlertSound}
                  style={{ background: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0', padding: '0.55rem 0.95rem', borderRadius: '8px', fontWeight: '800', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
                  title="Click to test the audio chime alert sound"
                >
                  <span>🔊 Test Sound Alert</span>
                </button>

                <button 
                  onClick={handleEnableNotifications}
                  style={{ 
                    background: notificationPermission === 'granted' ? '#ECFDF5' : '#FEF3C7', 
                    color: notificationPermission === 'granted' ? '#047857' : '#B45309', 
                    border: notificationPermission === 'granted' ? '1px solid #A7F3D0' : '1px solid #FDE68A', 
                    padding: '0.55rem 0.95rem', 
                    borderRadius: '8px', 
                    fontWeight: '800', 
                    fontSize: '0.85rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.4rem', 
                    cursor: 'pointer' 
                  }}
                  title="Enable browser desktop notifications for new order alerts"
                >
                  <span>{notificationPermission === 'granted' ? '🟢 Desktop Alerts Active' : '🔔 Enable Desktop Banners'}</span>
                </button>

                <button 
                  onClick={handleAdminLogout}
                  style={{ background: '#FEF2F2', color: '#991B1B', border: '1px solid #FCA5A5', padding: '0.55rem 1.1rem', borderRadius: '8px', fontWeight: '800', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
                >
                  <LogOut size={16} />
                  <span>Log Out Admin</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Admin Page Body */}
      <main style={{ maxWidth: '1400px', margin: '2rem auto', padding: '0 1.5rem' }}>
        {!isAuthenticated ? (
          /* Standalone Admin Login Card */
          <div style={{ maxWidth: '440px', margin: '4rem auto', background: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '2.5rem', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <Lock size={32} />
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#0F172A', marginBottom: '0.5rem' }}>BST Agro Admin Security Access</h2>
            <p style={{ fontSize: '0.88rem', color: '#64748B', marginBottom: '1.75rem' }}>Enter your 10-digit Admin PIN once to log in. Your session will remain saved on this device!</p>

            <form onSubmit={handleAdminPinSubmit}>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <input 
                  type="password" 
                  className="form-input" 
                  style={{ textAlign: 'center', fontSize: '1.25rem', fontWeight: '900', letterSpacing: '4px', padding: '0.85rem' }}
                  placeholder="Enter Admin PIN"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  autoFocus
                />
              </div>
              {pinError && <p style={{ color: '#EF4444', fontSize: '0.85rem', fontWeight: '800', marginBottom: '1.25rem' }}>{pinError}</p>}
              <button type="submit" style={{ width: '100%', background: '#056835', color: '#fff', padding: '0.85rem', borderRadius: '10px', fontWeight: '900', fontSize: '1rem', cursor: 'pointer' }}>
                Unlock Admin Dashboard
              </button>
            </form>
          </div>
        ) : (
          /* Standalone Full-Page Dashboard */
          <div>
            {/* Dashboard Tabs Bar */}
            <div style={{ background: '#ffffff', border: '1px solid #E2E8F0', padding: '0.65rem 1rem', borderRadius: '12px', marginBottom: '1.75rem', display: 'flex', gap: '0.75rem', overflowX: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <button 
                onClick={() => { setAdminTab('customers'); setEditingCustomer(null); }}
                style={{
                  padding: '0.65rem 1.25rem',
                  borderRadius: '8px',
                  fontWeight: '900',
                  fontSize: '0.92rem',
                  background: adminTab === 'customers' ? '#056835' : 'transparent',
                  color: adminTab === 'customers' ? '#ffffff' : '#475569',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer'
                }}
              >
                <Building2 size={18} />
                <span>Shop Accounts & Custom Pricing ({customers.length})</span>
              </button>

              <button 
                onClick={() => { setAdminTab('orders'); setEditingCustomer(null); }}
                style={{
                  padding: '0.65rem 1.25rem',
                  borderRadius: '8px',
                  fontWeight: '900',
                  fontSize: '0.92rem',
                  background: adminTab === 'orders' ? '#056835' : 'transparent',
                  color: adminTab === 'orders' ? '#ffffff' : '#475569',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer'
                }}
              >
                <ShoppingBag size={18} />
                <span>Live Order History ({orders.length})</span>
              </button>

              <button 
                onClick={() => { setAdminTab('prices'); setEditingCustomer(null); }}
                style={{
                  padding: '0.65rem 1.25rem',
                  borderRadius: '8px',
                  fontWeight: '900',
                  fontSize: '0.92rem',
                  background: adminTab === 'prices' ? '#056835' : 'transparent',
                  color: adminTab === 'prices' ? '#ffffff' : '#475569',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer'
                }}
              >
                <Package size={18} />
                <span>Base Catalog Prices ({products.length})</span>
              </button>
            </div>

            {/* TAB 1: SHOP ACCOUNTS & CUSTOM PRICING */}
            {adminTab === 'customers' && (
              <div style={{ background: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                {!editingCustomer ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#0F172A' }}>Registered Shops & Hotels Database</h3>
                        <p style={{ fontSize: '0.85rem', color: '#64748B' }}>Configure customer specific price lists and trigger instant WhatsApp price updates.</p>
                      </div>

                      <button 
                        onClick={() => setShowAddCustomerModal(true)}
                        style={{ background: '#056835', color: '#fff', padding: '0.6rem 1.2rem', borderRadius: '8px', fontWeight: '800', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
                      >
                        <Plus size={18} />
                        <span>Add New Shop Account</span>
                      </button>
                    </div>

                    <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
                        <thead style={{ background: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0', color: '#475569', fontWeight: '800' }}>
                          <tr>
                            <th style={{ padding: '0.85rem 1.1rem' }}>Shop / Hotel Name</th>
                            <th style={{ padding: '0.85rem 1.1rem' }}>Owner & Contact</th>
                            <th style={{ padding: '0.85rem 1.1rem' }}>Security PIN</th>
                            <th style={{ padding: '0.85rem 1.1rem' }}>Business Type</th>
                            <th style={{ padding: '0.85rem 1.1rem', textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {customers.map((c) => {
                            const customCount = Object.keys(c.customPrices || {}).length;
                            const summaryWaUrl = generateAllPricesSummaryLink(c.phone, c.ownerName, c.shopName, products, c.customPrices);

                            return (
                              <tr key={c.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                <td style={{ padding: '1rem 1.1rem', fontWeight: '900', color: '#0F172A' }}>
                                  🏢 {c.shopName}
                                  {customCount > 0 && (
                                    <div style={{ fontSize: '0.75rem', color: '#056835', fontWeight: '800', marginTop: '2px' }}>
                                      ⭐ {customCount} custom prices configured
                                    </div>
                                  )}
                                </td>
                                <td style={{ padding: '1rem 1.1rem', color: '#475569' }}>
                                  <div><strong>{c.ownerName}</strong></div>
                                  <div style={{ fontSize: '0.82rem', color: '#64748B' }}>📞 {c.phone}</div>
                                </td>
                                <td style={{ padding: '1rem 1.1rem', fontFamily: 'monospace', fontWeight: '900', color: '#D97706', fontSize: '1rem' }}>
                                  {c.pin || '1234'}
                                </td>
                                <td style={{ padding: '1rem 1.1rem', color: '#64748B', fontSize: '0.85rem' }}>
                                  {c.businessType}
                                </td>
                                <td style={{ padding: '1rem 1.1rem', textAlign: 'right' }}>
                                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                    <a
                                      href={summaryWaUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{ background: '#25D366', color: '#ffffff', padding: '0.45rem 0.85rem', borderRadius: '6px', fontWeight: '800', fontSize: '0.82rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                                      title="Send full WhatsApp price sheet to this customer"
                                    >
                                      <MessageCircle size={15} />
                                      <span>Notify Rates WA</span>
                                    </a>

                                    <button 
                                      onClick={() => setEditingCustomer(c)}
                                      style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FCD34D', padding: '0.45rem 0.85rem', borderRadius: '6px', fontWeight: '800', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}
                                    >
                                      <Edit3 size={15} />
                                      <span>Edit Custom Rates</span>
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
                  /* Custom Pricing Editor Screen */
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.85rem' }}>
                      <div>
                        <span style={{ fontSize: '0.8rem', color: '#056835', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Custom Rate Manager for:</span>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#0F172A' }}>🏢 {editingCustomer.shopName}</h3>
                        <p style={{ fontSize: '0.85rem', color: '#64748B' }}>Owner: {editingCustomer.ownerName} • Phone: <strong>{editingCustomer.phone}</strong></p>
                      </div>

                      <div style={{ display: 'flex', gap: '0.6rem' }}>
                        <a
                          href={generateAllPricesSummaryLink(editingCustomer.phone, editingCustomer.ownerName, editingCustomer.shopName, products, editingCustomer.customPrices)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ background: '#25D366', color: '#fff', padding: '0.55rem 1.1rem', borderRadius: '8px', fontWeight: '800', fontSize: '0.88rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                        >
                          <Send size={16} />
                          <span>📢 Send Full Rate Sheet on WhatsApp</span>
                        </a>

                        <button 
                          onClick={() => setEditingCustomer(null)}
                          style={{ background: '#0F172A', color: '#fff', padding: '0.55rem 1.1rem', borderRadius: '8px', fontWeight: '800', fontSize: '0.88rem', cursor: 'pointer' }}
                        >
                          ← Back to All Shops
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.15rem' }}>
                      {products.map((p) => {
                        const currentCustom = editingCustomer.customPrices ? editingCustomer.customPrices[p.id] : undefined;
                        const isSet = currentCustom !== undefined;
                        const activePrice = isSet ? currentCustom : p.price;
                        const notifyUrl = generatePriceUpdateNotificationLink(editingCustomer.phone, editingCustomer.ownerName, editingCustomer.shopName, p.name, activePrice, p.price);

                        return (
                          <div key={p.id} style={{ background: '#ffffff', border: isSet ? '2px solid #056835' : '1px solid #E2E8F0', padding: '1.1rem', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                <h4 style={{ fontSize: '0.95rem', fontWeight: '900', color: '#0F172A' }}>{p.name}</h4>
                                <div style={{ fontSize: '0.8rem', color: '#64748B' }}>Store Base Price: <strong>₹{p.price}</strong></div>
                              </div>
                              {isSet && (
                                <span style={{ background: '#E6F4ED', color: '#056835', fontSize: '0.7rem', fontWeight: '900', padding: '3px 8px', borderRadius: '4px' }}>
                                  CUSTOM RATE ACTIVE
                                </span>
                              )}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                              <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '0.75rem', color: '#056835', fontWeight: '800', display: 'block', marginBottom: '3px' }}>
                                  Special Price for Shop (₹)
                                </label>
                                <input 
                                  type="text" 
                                  inputMode="decimal"
                                  className="form-input" 
                                  style={{ padding: '0.5rem', fontWeight: '900', fontSize: '1.05rem', color: isSet ? '#056835' : '#0F172A' }}
                                  placeholder={`Base ₹${p.price}`}
                                  value={currentCustom !== undefined ? currentCustom : ''}
                                  onChange={(e) => handleCustomPriceChange(p.id, e.target.value)}
                                />
                              </div>

                              <a
                                href={notifyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  background: '#25D366',
                                  color: '#ffffff',
                                  padding: '0.55rem 0.85rem',
                                  borderRadius: '8px',
                                  fontWeight: '800',
                                  fontSize: '0.8rem',
                                  textDecoration: 'none',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.4rem',
                                  marginTop: '1.25rem'
                                }}
                                title={`Send WhatsApp price update notification to ${editingCustomer.ownerName}`}
                              >
                                <MessageCircle size={16} />
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

            {/* TAB 2: LIVE ORDER HISTORY */}
            {adminTab === 'orders' && (
              <div style={{ background: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#0F172A' }}>Live Submitted Customer Orders</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '3px' }}>
                      <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 10px #22C55E' }}></span>
                      <span style={{ fontSize: '0.82rem', color: '#056835', fontWeight: '800' }}>Real-Time Auto-Sync Active (Every 3s)</span>
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
                    style={{ background: '#E6F4ED', color: '#056835', border: '1px solid rgba(5,104,53,0.3)', padding: '0.55rem 1.1rem', borderRadius: '8px', fontWeight: '800', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
                  >
                    <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} />
                    <span>Refresh Orders Now</span>
                  </button>
                </div>

                {orders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#64748B', background: '#F8FAFC', borderRadius: '12px' }}>
                    <ShoppingBag size={52} color="#CBD5E1" style={{ margin: '0 auto 0.75rem' }} />
                    <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0F172A' }}>No orders logged in database yet</h4>
                    <p style={{ fontSize: '0.88rem' }}>New orders placed by shops will appear here live in real-time.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {orders.map((ord, idx) => {
                      const orderWaUrl = `https://wa.me/${ord.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello *${ord.ownerName || ord.shopName}*, regarding your order total ₹${ord.totalAmount}: Your order is confirmed and being prepared for dispatch by BST Agro & Dairy.`)}`;

                      return (
                        <div key={ord.id || idx} style={{ background: '#ffffff', border: '1.5px solid #E2E8F0', borderRadius: '12px', padding: '1.25rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.85rem', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div>
                              <h4 style={{ fontSize: '1.15rem', fontWeight: '900', color: '#0F172A' }}>🏢 {ord.shopName}</h4>
                              <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '2px' }}>
                                Owner: <strong>{ord.ownerName || 'Valued Customer'}</strong> • Contact: <strong>📞 {ord.phone}</strong>
                              </div>
                              <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '2px' }}>📍 Delivery Address: {ord.address || 'Standard Address'}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '1.3rem', fontWeight: '900', color: '#056835' }}>₹{Math.max(0, ord.totalAmount || 0).toLocaleString()}</div>
                              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '6px' }}>
                                <a
                                  href={orderWaUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ background: '#25D366', color: '#fff', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '800', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                                >
                                  <MessageCircle size={14} />
                                  <span>WhatsApp Customer</span>
                                </a>
                              </div>
                            </div>
                          </div>

                          <div style={{ fontSize: '0.88rem', color: '#475569' }}>
                            <strong style={{ color: '#0F172A' }}>Order Items:</strong>
                            <ul style={{ listStyle: 'none', paddingLeft: 0, marginTop: '0.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.5rem' }}>
                              {ord.items && ord.items.map((it, i) => (
                                <li key={i} style={{ background: '#F8FAFC', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between' }}>
                                  <span>• {it.name} x {it.qty}</span>
                                  <span><strong>₹{Math.max(0, (it.price || 0) * it.qty)}</strong></span>
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

            {/* TAB 3: BASE CATALOG PRICES */}
            {adminTab === 'prices' && (
              <div style={{ background: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#0F172A', marginBottom: '0.4rem' }}>Store Base Product Catalog Prices</h3>
                <p style={{ fontSize: '0.88rem', color: '#64748B', marginBottom: '1.5rem' }}>
                  Update standard base prices. Changes apply instantly to all shops that do not have custom price rates configured.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.15rem' }}>
                  {products.map(p => (
                    <div key={p.id} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '1.1rem', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h4 style={{ fontSize: '0.95rem', fontWeight: '900', color: '#0F172A' }}>{p.name}</h4>
                          <div style={{ fontSize: '0.8rem', color: '#64748B' }}>{p.brand} • {p.packSize}</div>
                        </div>
                        <div style={{ width: '105px' }}>
                          <label style={{ fontSize: '0.72rem', color: '#056835', fontWeight: '800', display: 'block', marginBottom: '2px' }}>Base Price (₹)</label>
                          <input 
                            type="text" 
                            inputMode="decimal"
                            className="form-input" 
                            style={{ padding: '0.45rem', fontWeight: '900', fontSize: '1.05rem' }}
                            value={p.price}
                            onChange={(e) => handleBasePriceChange(p.id, e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal: Add New Shop Account */}
        {showAddCustomerModal && (
          <div className="modal-overlay" style={{ zIndex: 3000 }}>
            <div className="modal-card" style={{ maxWidth: '460px', padding: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '900', color: '#0F172A' }}>Add New Shop Account</h3>
                <button onClick={() => setShowAddCustomerModal(false)} style={{ background: '#E2E8F0', padding: '6px', borderRadius: '50%' }}>
                  <X size={18} />
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
                <button type="submit" style={{ width: '100%', background: '#056835', color: '#fff', padding: '0.8rem', borderRadius: '10px', fontWeight: '900', fontSize: '0.95rem', cursor: 'pointer' }}>
                  Save Shop Account
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
