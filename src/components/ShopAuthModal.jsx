import React, { useState } from 'react';
import { X, Building2, Lock, Phone, User, MapPin, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../services/api';

export const ShopAuthModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Register Form State
  const [regData, setRegData] = useState({
    shopName: '',
    ownerName: '',
    phone: '',
    pin: '',
    businessType: 'Restaurant / Hotel',
    address: ''
  });

  if (!isOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!loginPhone.trim() || !loginPin.trim()) {
      setErrorMsg('Please enter your Phone Number and 4-Digit Security PIN.');
      return;
    }

    setIsLoading(true);

    try {
      const data = await api.loginCustomer(loginPhone, loginPin);
      onLoginSuccess(data.customer);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!regData.shopName.trim() || !regData.ownerName.trim() || !regData.phone.trim() || !regData.pin.trim()) {
      setErrorMsg('Please fill in all required fields (Shop Name, Owner Name, Phone Number, and 4-Digit PIN).');
      return;
    }

    if (regData.pin.trim().length !== 4 || isNaN(regData.pin.trim())) {
      setErrorMsg('Security PIN must be exactly 4 digits.');
      return;
    }

    setIsLoading(true);

    try {
      const data = await api.registerCustomer(regData);
      onLoginSuccess(data.customer);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', padding: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Building2 size={22} color="#056835" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#0F172A' }}>Shop & Hotel Portal</h2>
          </div>
          <button onClick={onClose} style={{ background: '#E2E8F0', padding: '6px', borderRadius: '50%' }}>
            <X size={18} color="#0F172A" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', background: '#F1F5F9', padding: '4px', borderRadius: '10px', marginBottom: '1.25rem' }}>
          <button 
            onClick={() => { setActiveTab('login'); setErrorMsg(''); }}
            style={{
              flex: 1,
              padding: '0.6rem',
              borderRadius: '8px',
              fontWeight: '800',
              fontSize: '0.9rem',
              background: activeTab === 'login' ? '#ffffff' : 'transparent',
              color: activeTab === 'login' ? '#056835' : '#64748B',
              boxShadow: activeTab === 'login' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none'
            }}
          >
            Shop Login
          </button>
          <button 
            onClick={() => { setActiveTab('register'); setErrorMsg(''); }}
            style={{
              flex: 1,
              padding: '0.6rem',
              borderRadius: '8px',
              fontWeight: '800',
              fontSize: '0.9rem',
              background: activeTab === 'register' ? '#ffffff' : 'transparent',
              color: activeTab === 'register' ? '#056835' : '#64748B',
              boxShadow: activeTab === 'register' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none'
            }}
          >
            New Shop Registration
          </button>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        {activeTab === 'login' ? (
          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label>Registered Phone Number *</label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} color="#64748B" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  className="form-input" 
                  style={{ paddingLeft: '2.4rem' }}
                  placeholder="e.g. 9876543210"
                  value={loginPhone}
                  onChange={(e) => setLoginPhone(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="form-group">
              <label>4-Digit Security PIN *</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="#64748B" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="password" 
                  maxLength={4}
                  className="form-input" 
                  style={{ paddingLeft: '2.4rem', letterSpacing: '4px', fontSize: '1.1rem', fontWeight: '900' }}
                  placeholder="****"
                  value={loginPin}
                  onChange={(e) => setLoginPin(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              style={{ width: '100%', background: '#056835', color: '#fff', padding: '0.8rem', borderRadius: '10px', fontWeight: '900', fontSize: '0.95rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Log In to My Shop'}
            </button>
          </form>
        ) : (
          /* Register Form */
          <form onSubmit={handleRegisterSubmit}>
            <div className="form-group">
              <label>Hotel / Shop Name * (Main Identifier)</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Hotel Grand Bawarchi"
                value={regData.shopName}
                onChange={(e) => setRegData({ ...regData, shopName: e.target.value })}
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label>Owner / Manager Name *</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Ramesh Kumar"
                value={regData.ownerName}
                onChange={(e) => setRegData({ ...regData, ownerName: e.target.value })}
                disabled={isLoading}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label>Phone / WhatsApp *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. 9876543210"
                  value={regData.phone}
                  onChange={(e) => setRegData({ ...regData, phone: e.target.value })}
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label>Set 4-Digit PIN *</label>
                <input 
                  type="password" 
                  maxLength={4}
                  className="form-input" 
                  placeholder="e.g. 1234"
                  value={regData.pin}
                  onChange={(e) => setRegData({ ...regData, pin: e.target.value })}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Business Type</label>
              <select 
                className="form-input"
                value={regData.businessType}
                onChange={(e) => setRegData({ ...regData, businessType: e.target.value })}
                disabled={isLoading}
              >
                <option value="Restaurant / Hotel">Restaurant / Hotel</option>
                <option value="Sweet Shop & Bakery">Sweet Shop & Bakery</option>
                <option value="Grocery Retail Store">Grocery Retail Store</option>
                <option value="Catering & Events">Catering & Event Organizers</option>
                <option value="Household / Direct Buyer">Household / Direct Buyer</option>
              </select>
            </div>

            <div className="form-group">
              <label>Full Delivery Address</label>
              <textarea 
                className="form-input" 
                rows="2"
                placeholder="H.No, Street Name, Area Landmark, City"
                value={regData.address}
                onChange={(e) => setRegData({ ...regData, address: e.target.value })}
                disabled={isLoading}
              ></textarea>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              style={{ width: '100%', background: '#056835', color: '#fff', padding: '0.8rem', borderRadius: '10px', fontWeight: '900', fontSize: '0.95rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Register & Start Ordering'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
