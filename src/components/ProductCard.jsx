import React from 'react';
import { Plus, Minus, MessageCircle, Star } from 'lucide-react';
import { getEffectivePrice } from '../data/customers';

export const ProductCard = ({ 
  product, 
  cartQty, 
  onAddToCart, 
  onUpdateQty, 
  onQuickView,
  currentCustomer
}) => {
  const effectivePrice = getEffectivePrice(product, currentCustomer);
  const isCustomRate = currentCustomer && currentCustomer.customPrices && currentCustomer.customPrices[product.id] !== undefined;

  const shopName = currentCustomer ? currentCustomer.shopName : 'Customer';
  const productWhatsappUrl = "https://wa.me/919949694030?text=" + encodeURIComponent(
    `Hello Bhaskar Reddy, order request from *${shopName}*:\n- *Product:* ${product.name}\n- *Brand:* ${product.brand}\n- *Pack Size:* ${product.packSize}\n- *Price:* ₹${effectivePrice}\n\nPlease confirm availability.`
  );

  return (
    <div className={`product-card ${product.isOwnBrand ? 'is-bst-brand' : ''}`}>
      {/* Top Header with Veg Symbol & Brand Badge */}
      <div className="product-card-header">
        {product.isVeg && <div className="veg-symbol" title="100% Pure Vegetarian"></div>}

        <span 
          className="brand-badge"
          style={{
            background: product.isOwnBrand ? '#056835' : '#1E293B',
            color: '#ffffff'
          }}
        >
          {product.isOwnBrand ? '🟢 BST FLAGSHIP' : product.brand}
        </span>
      </div>

      {/* Product Image */}
      <div className="product-img-wrapper" onClick={() => onQuickView(product)} title="Click for details">
        <img 
          src={product.imageUrl} 
          alt={product.name} 
          className="product-img"
          loading="lazy"
        />
      </div>

      {/* Product Info */}
      <div className="product-info">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
          <span className="product-brand-title">{product.brand}</span>
          {isCustomRate ? (
            <span style={{ fontSize: '0.7rem', color: '#056835', fontWeight: 800, background: '#E6F4ED', padding: '1px 6px', borderRadius: '4px' }}>
              🏢 Your Shop Rate
            </span>
          ) : (
            <span style={{ fontSize: '0.72rem', color: '#16A34A', fontWeight: 800 }}>In Stock</span>
          )}
        </div>
        
        <h3 className="product-title" onClick={() => onQuickView(product)} title="Click for details">
          {product.name}
        </h3>

        <div className="product-pack-size">
          📦 {product.packSize}
        </div>

        {/* Rating Row */}
        <div className="product-rating-row">
          <span className="rating-pill">
            <Star size={13} fill="#D97706" color="#D97706" /> {product.rating}
          </span>
          <span className="reviews-count">({product.reviewsCount} reviews)</span>
        </div>

        {/* Bottom Price & Add/Qty Controller Row */}
        <div className="product-bottom-row">
          <div className="price-box">
            <span className="price-label">PRICE</span>
            <div className="product-price">₹{effectivePrice.toLocaleString()}</div>
          </div>

          <div className="card-actions-wrapper">
            {cartQty > 0 ? (
              <div className="qty-controller">
                <button className="qty-btn minus" onClick={() => onUpdateQty(product.id, cartQty - 1)} title="Decrease quantity">
                  <Minus size={16} />
                </button>
                <span className="qty-val">{cartQty}</span>
                <button className="qty-btn plus" onClick={() => onUpdateQty(product.id, cartQty + 1)} title="Increase quantity">
                  <Plus size={16} />
                </button>
              </div>
            ) : (
              <div className="btn-group-row">
                <button className="add-btn" onClick={() => onAddToCart({ ...product, price: effectivePrice })} title="Add to cart">
                  <Plus size={16} />
                  <span>ADD</span>
                </button>

                <a 
                  href={productWhatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="quick-wa-btn"
                  title="Order directly via WhatsApp"
                >
                  <MessageCircle size={16} />
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
