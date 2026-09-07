import React from 'react';
import { X, Star, ShoppingCart, MessageCircle, ShieldCheck, Truck, Building } from 'lucide-react';

export const ProductDetailModal = ({ product, onClose, onAddToCart, cartQty, onUpdateQty }) => {
  if (!product) return null;

  const productWhatsappUrl = "https://wa.me/919949694030?text=" + encodeURIComponent(
    `Hello Bhaskar Reddy, I want to inquire about:\n- *Product:* ${product.name}\n- *Brand:* ${product.brand}\n- *Pack Size:* ${product.packSize}\n- *Price:* ₹${product.price}\n\nPlease confirm stock and bulk availability.`
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
          <button onClick={onClose} style={{ background: '#F1F5F9', padding: '6px', borderRadius: '50%' }}>
            <X size={20} color="#0F172A" />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'flex-start' }}>
          <div style={{ borderRadius: '12px', overflow: 'hidden', background: '#F1F5F9', border: '1px solid #E2E8F0' }}>
            <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '240px', objectFit: 'cover' }} />
          </div>

          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#056835', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
              {product.brand}
            </div>

            <h2 style={{ fontSize: '1.35rem', fontWeight: '900', color: '#0F172A', marginBottom: '0.5rem' }}>
              {product.name}
            </h2>

            <div style={{ fontSize: '0.88rem', color: '#64748B', marginBottom: '1rem', background: '#F8FAFC', padding: '4px 10px', borderRadius: '6px', width: 'fit-content' }}>
              📦 Pack Size: <strong>{product.packSize}</strong>
            </div>

            <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#0F172A', marginBottom: '1rem' }}>
              ₹{product.price.toLocaleString()}
            </div>

            <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              {product.description}
            </p>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {cartQty > 0 ? (
                <div className="qty-controller" style={{ height: '42px', padding: '0 8px' }}>
                  <button className="qty-btn" onClick={() => onUpdateQty(product.id, cartQty - 1)}>-</button>
                  <span className="qty-val" style={{ fontSize: '1rem' }}>{cartQty}</span>
                  <button className="qty-btn" onClick={() => onUpdateQty(product.id, cartQty + 1)}>+</button>
                </div>
              ) : (
                <button 
                  onClick={() => onAddToCart(product)}
                  style={{
                    background: '#056835',
                    color: '#fff',
                    padding: '0.75rem 1.4rem',
                    borderRadius: '8px',
                    fontWeight: '800',
                    fontSize: '0.95rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <ShoppingCart size={18} />
                  <span>Add to Cart</span>
                </button>
              )}

              <a 
                href={productWhatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: '#25D366',
                  color: '#fff',
                  padding: '0.75rem 1.2rem',
                  borderRadius: '8px',
                  fontWeight: '800',
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  textDecoration: 'none'
                }}
              >
                <MessageCircle size={18} />
                <span>WhatsApp Order</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
