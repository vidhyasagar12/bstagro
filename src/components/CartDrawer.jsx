import React, { useState, useEffect } from 'react';
import { X, Trash2, Plus, Minus, MessageCircle, PhoneCall, ShoppingBag, Truck, Building2 } from 'lucide-react';

export const CartDrawer = ({ 
  isOpen, 
  onClose, 
  cartItems, 
  onUpdateQty, 
  onRemoveItem, 
  onClearCart,
  currentCustomer,
  onRecordNewOrder
}) => {
  const [customerForm, setCustomerForm] = useState({
    shopName: '',
    ownerName: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    if (currentCustomer) {
      setCustomerForm({
        shopName: currentCustomer.shopName || '',
        ownerName: currentCustomer.ownerName || '',
        phone: currentCustomer.phone || '',
        address: currentCustomer.address || ''
      });
    }
  }, [currentCustomer]);

  if (!isOpen) return null;

  const totalPrice = cartItems.reduce((acc, item) => acc + (item.price * item.qty), 0);

  const handleSendWhatsAppOrder = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (cartItems.length === 0) return;

    const shopTitle = customerForm.shopName || (currentCustomer ? currentCustomer.shopName : 'Direct Customer');
    const ownerTitle = customerForm.ownerName || (currentCustomer ? currentCustomer.ownerName : 'Valued Customer');
    const phoneNum = customerForm.phone || (currentCustomer ? currentCustomer.phone : 'Not specified');
    const addressStr = customerForm.address || (currentCustomer ? currentCustomer.address : 'Standard Delivery Address');

    let itemsSummary = cartItems.map((item, idx) => 
      `${idx + 1}. *${item.name}* (${item.brand})\n   Qty: ${item.qty} x ₹${item.price} = ₹${(item.qty * item.price).toLocaleString()}`
    ).join('\n\n');

    let msg = `🏢 *NEW ORDER FROM: ${shopTitle.toUpperCase()}*\n` +
              `----------------------------------------\n` +
              `👤 *Owner / Contact:* ${ownerTitle}\n` +
              `📞 *Phone:* ${phoneNum}\n` +
              `📍 *Delivery Address:* ${addressStr}\n\n` +
              `📦 *ITEMIZED ORDER DETAILS (${cartItems.length} items):*\n\n${itemsSummary}\n\n` +
              `----------------------------------------\n` +
              `💰 *TOTAL PAYABLE AMOUNT:* ₹${totalPrice.toLocaleString()}\n` +
              `----------------------------------------\n` +
              `Please confirm stock availability and dispatch time. Thank you!`;

    const whatsappUrl = `https://wa.me/919949694030?text=${encodeURIComponent(msg)}`;

    // Record order in Express SQLite database concurrently
    const orderData = {
      customerId: currentCustomer ? currentCustomer.id : null,
      shopName: shopTitle,
      ownerName: ownerTitle,
      phone: phoneNum,
      address: addressStr,
      items: cartItems.map(i => ({ id: i.id, name: i.name, packSize: i.packSize, price: i.price, qty: i.qty })),
      totalAmount: totalPrice
    };

    if (onRecordNewOrder) {
      onRecordNewOrder(orderData).catch(err => {
        console.error('Failed to log order to database:', err);
      });
    }

    // Reset local cart & close drawer
    onClearCart();
    onClose();

    // Redirect to WhatsApp - location.href is universally supported on mobile (iOS/Android) & bypasses popup blockers
    window.location.href = whatsappUrl;
  };

  return (
    <div className="cart-overlay" onClick={onClose}>
      <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="cart-header">
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🛒 Shopping Cart</span>
              <span style={{ fontSize: '0.8rem', background: '#056835', color: '#fff', padding: '2px 9px', borderRadius: '9999px' }}>
                {cartItems.length} items
              </span>
            </h2>
            {currentCustomer ? (
              <p style={{ fontSize: '0.8rem', color: '#056835', fontWeight: '800' }}>
                🏢 Ordering for: <strong>{currentCustomer.shopName}</strong>
              </p>
            ) : (
              <p style={{ fontSize: '0.8rem', color: '#64748B' }}>BST Agro & Dairy Direct Supply</p>
            )}
          </div>

          <button type="button" onClick={onClose} style={{ background: '#E2E8F0', padding: '6px', borderRadius: '50%', border: 'none', cursor: 'pointer' }}>
            <X size={18} color="#0F172A" />
          </button>
        </div>

        {/* Body */}
        <div className="cart-body">
          {cartItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#64748B' }}>
              <ShoppingBag size={54} color="#CBD5E1" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ color: '#0F172A', marginBottom: '0.4rem', fontSize: '1.2rem', fontWeight: 800 }}>Your cart is empty</h3>
              <p style={{ fontSize: '0.9rem' }}>Browse BST fresh dairy products and click "+ ADD" to select items.</p>
            </div>
          ) : (
            <div>
              {cartItems.map((item) => (
                <div key={item.id} className="cart-item">
                  <img src={item.imageUrl || item.image} alt={item.name} className="cart-item-img" />
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '0.92rem', fontWeight: '800', color: '#0F172A' }}>{item.name}</h4>
                    <span style={{ fontSize: '0.78rem', color: '#056835', fontWeight: '700' }}>{item.brand} • {item.packSize}</span>
                    <div style={{ fontSize: '0.95rem', fontWeight: '900', color: '#0F172A', marginTop: '2px' }}>
                      ₹{item.price * item.qty} <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '600' }}>(₹{item.price} x {item.qty})</span>
                    </div>
                  </div>

                  <div className="qty-controller">
                    <button type="button" className="qty-btn" onClick={() => onUpdateQty(item.id, item.qty - 1)}>-</button>
                    <span className="qty-val">{item.qty}</span>
                    <button type="button" className="qty-btn" onClick={() => onUpdateQty(item.id, item.qty + 1)}>+</button>
                  </div>

                  <button type="button" onClick={() => onRemoveItem(item.id)} style={{ background: 'transparent', color: '#EF4444', padding: '4px', border: 'none', cursor: 'pointer' }} title="Remove item">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}

              {/* Customer / Shop Details Form */}
              <div style={{ marginTop: '1.5rem', background: '#F8FAFC', padding: '1.1rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#056835', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Building2 size={18} />
                  <span>Step 2: Verify Shop / Hotel Details</span>
                </h4>

                <div className="form-group">
                  <label>Hotel / Shop Name * (Primary Identifier)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Hotel Grand Bawarchi"
                    value={customerForm.shopName}
                    onChange={(e) => setCustomerForm({...customerForm, shopName: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>Owner / Manager Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Ramesh Kumar"
                    value={customerForm.ownerName}
                    onChange={(e) => setCustomerForm({...customerForm, ownerName: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>Phone / WhatsApp Number</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. 9876543210"
                    value={customerForm.phone}
                    onChange={(e) => setCustomerForm({...customerForm, phone: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>Delivery Address & Landmark</label>
                  <textarea 
                    className="form-input" 
                    rows="2"
                    placeholder="Enter street address & landmark"
                    value={customerForm.address}
                    onChange={(e) => setCustomerForm({...customerForm, address: e.target.value})}
                  ></textarea>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="cart-footer">
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: '900', color: '#0F172A', marginBottom: '1rem' }}>
              <span>Total Payable Amount:</span>
              <span style={{ color: '#056835' }}>₹{totalPrice.toLocaleString()}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <button 
                type="button"
                onClick={handleSendWhatsAppOrder}
                style={{
                  width: '100%',
                  background: '#25D366',
                  color: '#ffffff',
                  padding: '0.85rem',
                  borderRadius: '10px',
                  fontWeight: '900',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 14px rgba(37, 211, 102, 0.35)',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <MessageCircle size={20} />
                <span>Send Order via WhatsApp</span>
              </button>

              <a 
                href="tel:+919949694030"
                style={{
                  width: '100%',
                  background: '#0F172A',
                  color: '#ffffff',
                  padding: '0.75rem',
                  borderRadius: '10px',
                  fontWeight: '800',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  textDecoration: 'none'
                }}
              >
                <PhoneCall size={16} color="#4ADE80" />
                <span>Or Call +91 99496 94030 to Order</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
