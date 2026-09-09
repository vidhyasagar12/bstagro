import React from 'react';
import { MessageCircle, CheckCircle2, Sparkles, Award, ShoppingCart } from 'lucide-react';

export const HeroBanner = ({ 
  setSelectedBrand, 
  featuredProduct, 
  featuredPrice, 
  onAddToCart 
}) => {
  const whatsappUrl = "https://wa.me/919949694030?text=" + encodeURIComponent("Hello Bhaskar Reddy, I want to order BST Fresh Cottage Paneer (Our Flagship Item) and get daily delivery details.");

  // Dedicated 100% to BST Fresh Cottage Paneer branding (only price is dynamic)
  const displayPrice = (featuredPrice !== undefined && featuredPrice !== null && featuredPrice > 0) 
    ? featuredPrice 
    : (featuredProduct?.price || 250);
  
  const basePrice = featuredProduct?.price;

  const handleBuyClick = () => {
    if (onAddToCart) {
      const paneerItem = featuredProduct || {
        id: 'bst-paneer-1kg',
        name: 'BST Fresh Cottage Paneer',
        brand: 'BST Agro & Dairy',
        brandId: 'bst',
        category: 'Paneer & Khova',
        price: displayPrice,
        packSize: '1 kg Pack',
        image: '/bst-paneer.png',
        description: 'Processed daily at our own BST Agro & Dairy plant. 100% Pure Milk Paneer.',
        inStock: true,
        isFlagship: true,
        isOwnBrand: true
      };
      onAddToCart(paneerItem);
    } else {
      setSelectedBrand('bst');
    }
  };

  return (
    <div className="ecommerce-hero">
      <div className="hero-card">
        {/* Left Side: Static BST Flagship Branding */}
        <div className="hero-left">
          <div className="hero-badge">
            <Award size={16} color="#FACC15" />
            <span>DIRECT FACTORY FLAGSHIP DAIRY</span>
          </div>

          <h1>BST Fresh Cottage Paneer <span>100% Pure & Authentic</span></h1>

          <p className="hero-subtitle">
            Processed daily at our state-of-the-art BST Agro & Dairy plant. Ultra-soft texture, high protein, and rich natural milk taste — trusted by households, top hotels, and commercial kitchens across Telangana.
          </p>

          <div className="hero-features">
            <div className="hero-feature-item">
              <CheckCircle2 size={16} color="#FACC15" />
              <span>100% Pure Milk Paneer</span>
            </div>
            <div className="hero-feature-item">
              <CheckCircle2 size={16} color="#FACC15" />
              <span>Wholesale & Retail Direct</span>
            </div>
            <div className="hero-feature-item">
              <CheckCircle2 size={16} color="#FACC15" />
              <span>Daily Morning Dispatch</span>
            </div>
          </div>

          <div className="hero-cta-buttons">
            <button 
              onClick={() => setSelectedBrand('bst')}
              className="cta-primary-btn"
            >
              ⭐ Explore BST Dairy Range
            </button>

            <a 
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="cta-wa-btn"
            >
              <MessageCircle size={18} />
              <span>Order Paneer on WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Right Side: Dedicated BST Paneer Packet Showcase */}
        <div className="hero-product-showcase">
          <div className="showcase-badge">
            <Sparkles size={14} /> #1 BEST SELLER
          </div>
          
          <div className="showcase-img-container">
            <img 
              src="/bst-paneer.png" 
              alt="BST Fresh Cottage Paneer Packet" 
              className="showcase-paneer-img"
              onError={(e) => { e.target.src = '/bst-paneer.png'; }}
            />
          </div>

          <div className="showcase-info">
            <div className="showcase-title">BST Fresh Cottage Paneer</div>
            <div className="showcase-price-tag">
              <span>₹{displayPrice}</span>
              {basePrice && basePrice > displayPrice && (
                <span style={{ textDecoration: 'line-through', opacity: 0.6, fontSize: '0.85em', marginLeft: '6px', color: '#94a3b8' }}>
                  ₹{basePrice}
                </span>
              )}
              <small>/ 1kg</small>
            </div>
            
            <button 
              onClick={handleBuyClick}
              className="showcase-buy-btn"
            >
              <ShoppingCart size={16} /> Add to Cart • ₹{displayPrice}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
