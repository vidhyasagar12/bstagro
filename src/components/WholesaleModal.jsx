import React, { useState } from 'react';
import { X, Building2, MessageCircle, CheckCircle2 } from 'lucide-react';

export const WholesaleModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    businessName: '',
    contactPerson: '',
    phone: '',
    businessType: 'Restaurant / Hotel',
    dailyRequirement: '50-100 kg Paneer & Dairy'
  });

  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const msg = `🏢 *BST WHOLESALE B2B INQUIRY*\n` +
                `-----------------------------------\n` +
                `• *Business Name:* ${formData.businessName}\n` +
                `• *Contact Person:* ${formData.contactPerson}\n` +
                `• *Phone:* ${formData.phone}\n` +
                `• *Category:* ${formData.businessType}\n` +
                `• *Est. Daily Requirement:* ${formData.dailyRequirement}\n\n` +
                `Please send wholesale rate card and contract delivery terms to Bhaskar Reddy. Thanks!`;

    const whatsappUrl = `https://wa.me/919949694030?text=${encodeURIComponent(msg)}`;
    window.open(whatsappUrl, '_blank');
    setSubmitted(true);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Building2 size={22} color="#056835" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#0F172A' }}>Wholesale B2B Rate Inquiry</h2>
          </div>
          <button onClick={onClose} style={{ background: '#E2E8F0', padding: '6px', borderRadius: '50%' }}>
            <X size={18} color="#0F172A" />
          </button>
        </div>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <CheckCircle2 size={50} color="#16A34A" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0F172A', marginBottom: '0.5rem' }}>Inquiry Sent via WhatsApp!</h3>
            <p style={{ color: '#64748B', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
              Your wholesale requirement details have been opened in WhatsApp. Our sales team will get back to you shortly.
            </p>
            <button 
              onClick={() => { setSubmitted(false); onClose(); }}
              style={{ background: '#056835', color: '#fff', padding: '0.65rem 1.5rem', borderRadius: '8px', fontWeight: '800' }}
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Business / Hotel / Store Name *</label>
              <input 
                type="text" 
                required
                className="form-input" 
                placeholder="e.g. Royal Grand Hotel & Caterers" 
                value={formData.businessName}
                onChange={(e) => setFormData({...formData, businessName: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>Contact Person Name *</label>
              <input 
                type="text" 
                required
                className="form-input" 
                placeholder="e.g. Bhaskar / Suresh Manager" 
                value={formData.contactPerson}
                onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>Phone / WhatsApp Number *</label>
              <input 
                type="text" 
                required
                className="form-input" 
                placeholder="+91 98765 43210" 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>Business Type</label>
              <select 
                className="form-input"
                value={formData.businessType}
                onChange={(e) => setFormData({...formData, businessType: e.target.value})}
              >
                <option value="Restaurant / Hotel / Cafe">Restaurant / Hotel / Cafe</option>
                <option value="Sweet Shop & Bakery">Sweet Shop & Bakery Manufacturer</option>
                <option value="Catering & Banquet Service">Catering & Banquet Service</option>
                <option value="Supermarket / Retailer">Supermarket / Retail Grocery Store</option>
                <option value="Institutional Canteen">Institutional / Corporate Canteen</option>
              </select>
            </div>

            <div className="form-group">
              <label>Est. Daily / Weekly Volume Requirement</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. 50 kg BST Paneer + 20 kg Butter daily" 
                value={formData.dailyRequirement}
                onChange={(e) => setFormData({...formData, dailyRequirement: e.target.value})}
              />
            </div>

            <button 
              type="submit"
              style={{
                width: '100%',
                background: '#25D366',
                color: '#ffffff',
                padding: '0.85rem',
                borderRadius: '8px',
                fontWeight: '900',
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                marginTop: '1.25rem'
              }}
            >
              <MessageCircle size={20} />
              <span>Send Wholesale Inquiry via WhatsApp</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
