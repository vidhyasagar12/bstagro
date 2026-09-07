import React, { useState } from 'react';
import { BRANDS } from '../data/products';
import { ProductCard } from './ProductCard';
import { ChevronDown, ChevronUp, Building2, Layers, CheckCircle2 } from 'lucide-react';

export const BrandAccordionSection = ({ 
  filteredProducts, 
  cartItems, 
  handleAddToCart, 
  handleUpdateQty, 
  setQuickViewProduct, 
  currentCustomer,
  selectedCategory,
  searchTerm
}) => {
  // State for expanded brands (BST Agro expanded by default: 'bst')
  const [expandedBrands, setExpandedBrands] = useState({
    'bst': true
  });

  const toggleBrand = (brandId) => {
    setExpandedBrands(prev => ({
      ...prev,
      [brandId]: !prev[brandId]
    }));
  };

  const expandAll = () => {
    const allExpanded = {};
    BRANDS.forEach(b => {
      if (b.id !== 'all') allExpanded[b.id] = true;
    });
    setExpandedBrands(allExpanded);
  };

  const collapseAll = () => {
    setExpandedBrands({});
  };

  const nonAllBrands = BRANDS.filter(b => b.id !== 'all');

  return (
    <div className="brand-accordion-wrapper">
      {/* Mobile & Desktop Accordion Controls Bar */}
      <div className="brand-accordion-controls">
        <div className="controls-left">
          <Building2 size={18} color="#056835" />
          <span className="controls-title">Company / Manufacturer Brands</span>
        </div>
        <div className="controls-right">
          <button onClick={expandAll} className="accordion-ctrl-btn">
            Expand All
          </button>
          <button onClick={collapseAll} className="accordion-ctrl-btn secondary">
            Collapse All
          </button>
        </div>
      </div>

      <div className="brand-accordion-container">
        {nonAllBrands.map(brand => {
          const brandProducts = filteredProducts.filter(p => p.brandId === brand.id);
          if (brandProducts.length === 0) return null;

          // If search or specific category filter active, auto-expand
          const isExpanded = (searchTerm || selectedCategory !== 'All Categories') 
            ? true 
            : !!expandedBrands[brand.id];

          return (
            <div 
              key={brand.id} 
              className={`brand-accordion-card ${brand.isOwnBrand ? 'is-bst-accordion' : ''}`}
            >
              {/* Clickable Full-Width Company Header Row */}
              <button 
                className={`brand-accordion-header ${isExpanded ? 'active-header' : ''}`}
                onClick={() => toggleBrand(brand.id)}
                aria-expanded={isExpanded}
                style={{
                  background: brand.isOwnBrand 
                    ? 'linear-gradient(135deg, #045229 0%, #056835 100%)' 
                    : isExpanded ? '#F8FAFC' : '#FFFFFF',
                  color: brand.isOwnBrand ? '#ffffff' : '#0F172A'
                }}
              >
                <div className="brand-header-left">
                  <span className="brand-logo-badge">{brand.logoBadge}</span>
                  <div className="brand-name-group">
                    <span className="brand-title-name">{brand.name}</span>
                    {brand.isOwnBrand && (
                      <span className="own-brand-flag">⭐ FLAGSHIP MANUFACTURER</span>
                    )}
                  </div>
                  <span 
                    className="brand-item-count"
                    style={{
                      background: brand.isOwnBrand ? '#FACC15' : '#E2E8F0',
                      color: brand.isOwnBrand ? '#000000' : '#334155'
                    }}
                  >
                    {brandProducts.length} {brandProducts.length === 1 ? 'item' : 'items'}
                  </span>
                </div>

                <div className="brand-header-right">
                  <span className="toggle-text-hint">
                    {isExpanded ? 'Hide ▲' : 'View ▼'}
                  </span>
                  <div className="chevron-icon-box">
                    {isExpanded ? (
                      <ChevronUp size={22} color={brand.isOwnBrand ? '#FACC15' : '#056835'} />
                    ) : (
                      <ChevronDown size={22} color={brand.isOwnBrand ? '#FACC15' : '#056835'} />
                    )}
                  </div>
                </div>
              </button>

              {/* Expandable Vertical Product Grid Body */}
              {isExpanded && (
                <div className="brand-accordion-body">
                  {brand.description && (
                    <p className="brand-sub-description">{brand.description}</p>
                  )}

                  <div className="product-grid">
                    {brandProducts.map(product => {
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
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
