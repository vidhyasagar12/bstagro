import React from 'react';
import { MessageCircle, PhoneCall, CheckCircle2, Sparkles, Award, ShoppingCart } from 'lucide-react';

export const HeroBanner = ({ onOpenWholesaleModal, setSelectedBrand }) => {
  const whatsappUrl = "https://wa.me/919949694030?text=" + encodeURIComponent("Hello Bhaskar Reddy, I want to order BST Fresh Paneer (Our Flagship Item) and get daily delivery details.");

  return (
    <div className="ecommerce-hero">
      <div className="hero-card">
        {/* Left Side: Headline & Features */}
        <div className="hero-left">
          <div className="hero-badge">
            <Award size={16} color="#FACC15" />
            <span>OUR OWN FACTORY FLAGSHIP BRAND</span>
          </div>

          <h1>BST Fresh Cottage Paneer <span>100% Pure & Authentic</span></h1>

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
              src="/bst-paneer.png" 
              alt="BST Fresh Cottage Paneer Packet" 
              className="showcase-paneer-img"
            />
          </div>

          <div className="showcase-info">
            <div className="showcase-title">BST Fresh Cottage Paneer</div>
            <div className="showcase-price-tag">
              <span>₹250</span> <small>/ 1 kg Pack</small>
            </div>
            <button 
              onClick={() => setSelectedBrand('bst')}
              className="showcase-buy-btn"
            >
              <ShoppingCart size={16} /> View BST Dairy Items
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
