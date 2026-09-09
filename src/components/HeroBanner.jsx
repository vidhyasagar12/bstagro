import React from 'react';
import { MessageCircle, PhoneCall, CheckCircle2, Sparkles, Award, ShoppingCart } from 'lucide-react';

export const HeroBanner = ({ 
  onOpenWholesaleModal, 
  setSelectedBrand, 
  featuredProduct, 
  featuredPrice, 
  onAddToCart 
}) => {
  const whatsappUrl = "https://wa.me/919949694030?text=" + encodeURIComponent("Hello Bhaskar Reddy, I want to order BST Fresh Paneer (Our Flagship Item) and get daily delivery details.");

  const displayTitle = featuredProduct?.name || "BST Fresh Cottage Paneer";
  const displayPrice = (featuredPrice !== undefined && featuredPrice !== null) 
    ? featuredPrice 
    : (featuredProduct?.price || 250);
  const displayOriginalPrice = featuredProduct?.price;
  const displayPackSize = featuredProduct?.packSize || featuredProduct?.packsize || "1 kg Pack";
  const displayImg = featuredProduct?.imageUrl || featuredProduct?.image || "/bst-paneer.png";

  return (
    <div className="ecommerce-hero">
      <div className="hero-card">
        {/* Left Side: Headline & Features */}
        <div className="hero-left">
          <div className="hero-badge">
            <Award size={16} color="#FACC15" />
            <span>OUR OWN FACTORY FLAGSHIP BRAND</span>
          </div>

          <h1>{displayTitle} <span>100% Pure & Authentic</span></h1>

          <p className="hero-subtitle">
            Processed daily at our own BST Agro & Dairy plant. Soft texture, high protein, rich milk taste — trusted by households, hotels, and top commercial kitchens.
          </p>

          <div className="hero-features">
            <div className="hero-feature-item">
              <CheckCircle2 size={18} color="#FACC15" />
              <span>100% Milk Pure Paneer</span>
            </div>
            <div className="hero-feature-item">
              <CheckCircle2 size={18} color="#FACC15" />
              <span>Direct Factory Wholesale & Retail</span>
            </div>
            <div className="hero-feature-item">
              <CheckCircle2 size={18} color="#FACC15" />
              <span>Same-Day Fresh Dispatch</span>
            </div>
          </div>

          <div className="hero-cta-buttons">
            <button 
              onClick={() => setSelectedBrand('bst')}
              className="cta-primary-btn"
            >
              ⭐ Shop All BST Dairy Products
            </button>

            <a 
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="cta-wa-btn"
            >
              <MessageCircle size={18} />
              <span>Order BST Paneer on WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Right Side: Featured Product Packet Showcase */}
        <div className="hero-product-showcase">
          <div className="showcase-badge">
            <Sparkles size={14} /> #1 BEST SELLER
          </div>
          
          <div className="showcase-img-container">
            <img 
              src={displayImg} 
              alt={displayTitle} 
              className="showcase-paneer-img"
              onError={(e) => { e.target.src = '/bst-paneer.png'; }}
            />
          </div>

          <div className="showcase-info">
            <div className="showcase-title">{displayTitle}</div>
            <div className="showcase-price-tag">
              <span>₹{displayPrice}</span>
              {displayOriginalPrice && displayOriginalPrice > displayPrice && (
                <span style={{ textDecoration: 'line-through', opacity: 0.6, fontSize: '0.85em', marginLeft: '6px', color: '#94a3b8' }}>
                  ₹{displayOriginalPrice}
                </span>
              )}
              <small>/ {displayPackSize}</small>
            </div>
            {featuredProduct && onAddToCart ? (
              <button 
                onClick={() => onAddToCart(featuredProduct)}
                className="showcase-buy-btn"
              >
                <ShoppingCart size={16} /> Add to Cart • ₹{displayPrice}
              </button>
            ) : (
              <button 
                onClick={() => setSelectedBrand('bst')}
                className="showcase-buy-btn"
              >
                <ShoppingCart size={16} /> View BST Dairy Items
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
