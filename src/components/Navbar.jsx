import React from 'react';
import { Logo } from './Logo';
import { Search, ShoppingCart, Building2, UserCheck, LogOut } from 'lucide-react';

export const Navbar = ({ 
  searchTerm, 
  setSearchTerm, 
  cartCount, 
  cartTotal, 
  onOpenCart, 
  currentCustomer,
  onOpenAuthModal,
  onLogoutCustomer
}) => {
  return (
    <nav className="navbar">
      <div className="navbar-header-row">
        <div className="navbar-logo-wrapper" style={{ cursor: 'pointer' }} onClick={() => setSearchTerm('')} title="BST Agro & Dairy Home">
          <Logo size={46} showText={true} />
        </div>

        <div className="nav-actions">
          {/* Customer Account Indicator / Login Button */}
          {currentCustomer ? (
            <div className="shop-logged-in-pill">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <UserCheck size={16} color="#056835" />
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                  <span className="shop-pill-label" style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: '700' }}>Active Shop:</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: '900', color: '#0F172A' }}>{currentCustomer.shopName}</span>
                </div>
              </div>
              <button 
                onClick={onLogoutCustomer} 
                className="logout-mini-btn"
                title="Log out or switch shop account"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button className="shop-login-btn" onClick={onOpenAuthModal} title="Login with Shop Name & 4-Digit PIN">
              <Building2 size={16} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }}>
                <span style={{ fontSize: '0.82rem', fontWeight: '900' }}>Shop Login</span>
                <span className="b2b-subtext" style={{ fontSize: '0.68rem', opacity: 0.85 }}>Rates & Orders</span>
              </div>
            </button>
          )}

          <button className="cart-btn" onClick={onOpenCart} title="View Cart & Checkout">
            <ShoppingCart size={18} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }}>
              <span className="cart-btn-label" style={{ fontSize: '0.7rem', opacity: 0.9, textTransform: 'uppercase' }}>Cart</span>
              <span style={{ fontSize: '0.9rem', fontWeight: '900' }}>₹{cartTotal.toLocaleString()}</span>
            </div>
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
        </div>
      </div>

      <div className="search-box">
        <Search className="search-icon" size={18} />
        <input 
          type="text" 
          className="search-input" 
          placeholder="Search Paneer, Milk, Butter, Ghee, Cheese..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button 
            className="search-clear-btn" 
            onClick={() => setSearchTerm('')}
            title="Clear search"
          >
            ✕
          </button>
        )}
      </div>
    </nav>
  );
};
