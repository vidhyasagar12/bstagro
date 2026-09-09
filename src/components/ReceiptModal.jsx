import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { 
  Download, 
  MessageCircle, 
  X, 
  Building2, 
  CheckCircle2, 
  Calendar, 
  MapPin, 
  Phone, 
  ShieldCheck, 
  FileText
} from 'lucide-react';

export const ReceiptModal = ({
  isOpen,
  onClose,
  cartItems = [],
  customerForm = {},
  orderId = `BST-${Math.floor(100000 + Math.random() * 900000)}`,
  totalPrice = 0
}) => {
  const receiptRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen) return null;

  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Download receipt card as high-res PNG image
  const handleDownloadImage = async () => {
    if (!receiptRef.current) return;
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2.5, // High resolution crisp image
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });
      
      const image = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.href = image;
      link.download = `BST_Agro_Bill_${customerForm.shopName ? customerForm.shopName.replace(/[^a-zA-Z0-9]/g, '_') : 'Receipt'}_${orderId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error generating image receipt:', error);
      alert('Failed to generate image receipt. Please try taking a screenshot.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Format order summary and open WhatsApp chat
  const handleSendWhatsApp = () => {
    const shopName = customerForm.shopName || 'Valued Customer';
    const itemsText = cartItems.map((item, idx) => 
      `${idx + 1}. *${item.name}* (${item.brand} • ${item.packSize})\n   Qty: ${item.qty} x ₹${item.price} = *₹${(item.price * item.qty).toLocaleString()}*`
    ).join('\n');

    const whatsappMessage = 
      `🧾 *NEW B2B ORDER — BST AGRO & DAIRY*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📌 *Order ID:* #${orderId}\n` +
      `🏨 *Shop/Hotel:* ${shopName}\n` +
      `👤 *Owner/Manager:* ${customerForm.ownerName || 'N/A'}\n` +
      `📞 *Phone:* ${customerForm.phone || 'N/A'}\n` +
      `📍 *Address:* ${customerForm.address || 'N/A'}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📦 *ORDER DETAILS:*\n${itemsText}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `💰 *TOTAL PAYABLE:* ₹${totalPrice.toLocaleString()}\n` +
      `💳 *Payment:* Cash / UPI on Delivery\n` +
      `📅 *Date:* ${currentDate}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🖼️ _Image receipt generated & downloaded!_\n` +
      `Please confirm delivery dispatch. Thank you!`;

    const encodedMessage = encodeURIComponent(whatsappMessage);
    const whatsappUrl = `https://wa.me/919949694030?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="receipt-modal-overlay">
      <div className="receipt-modal-content">
        {/* Modal Header Controls */}
        <div className="receipt-modal-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={20} color="#056835" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              Official Image Receipt Preview
            </h3>
          </div>
          <button onClick={onClose} className="receipt-close-btn" title="Close preview">
            <X size={20} />
          </button>
        </div>

        {/* Printable & Capturable Receipt Document */}
        <div className="receipt-scroll-area">
          <div ref={receiptRef} className="receipt-card-document">
            {/* Header Banner */}
            <div className="receipt-header-banner">
              <div className="receipt-brand-badge">🟢 BST AGRO & DAIRY</div>
              <h1 className="receipt-company-title">BST AGRO & DAIRY PRODUCTS</h1>
              <p className="receipt-company-subtitle">
                Fresh Dairy Manufacturer • Wholesale Supply for Hotels, Restaurants & Retailers
              </p>
              <div className="receipt-company-contacts">
                <span>📞 +91 99496 94030</span>
                <span>•</span>
                <span>📧 bstagrodairy@gmail.com</span>
                <span>•</span>
                <span>📍 Telangana, India</span>
              </div>
            </div>

            {/* Invoice Metadata Row */}
            <div className="receipt-meta-grid">
              <div>
                <span className="meta-label">INVOICE NUMBER</span>
                <span className="meta-value-highlight">#{orderId}</span>
              </div>
              <div>
                <span className="meta-label">DATE & TIME</span>
                <span className="meta-value">{currentDate}</span>
              </div>
              <div>
                <span className="meta-label">PAYMENT METHOD</span>
                <span className="meta-value" style={{ color: '#056835', fontWeight: 800 }}>Cash / UPI on Delivery</span>
              </div>
            </div>

            {/* Customer Details Box */}
            <div className="receipt-customer-box">
              <div className="customer-box-title">
                <Building2 size={16} color="#056835" />
                <span>CUSTOMER & HOTEL DETAILS</span>
              </div>
              <div className="customer-details-grid">
                <div>
                  <strong style={{ fontSize: '1rem', color: '#0F172A' }}>
                    {customerForm.shopName || 'Hotel / Shop Name'}
                  </strong>
                  {customerForm.ownerName && (
                    <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '2px' }}>
                      Manager: {customerForm.ownerName}
                    </div>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Phone size={13} color="#056835" />
                    <span>{customerForm.phone || 'Phone not specified'}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px' }}>
                    <MapPin size={13} color="#056835" />
                    <span>{customerForm.address || 'Address not specified'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Itemized Order Table */}
            <table className="receipt-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>#</th>
                  <th>ITEM DESCRIPTION</th>
                  <th>BRAND</th>
                  <th>PACK</th>
                  <th style={{ textAlign: 'center' }}>QTY</th>
                  <th style={{ textAlign: 'right' }}>RATE</th>
                  <th style={{ textAlign: 'right' }}>AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {cartItems.map((item, index) => (
                  <tr key={item.id || index}>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: '#64748B' }}>{index + 1}</td>
                    <td style={{ fontWeight: 800, color: '#0F172A' }}>{item.name}</td>
                    <td><span className="brand-tag">{item.brand}</span></td>
                    <td style={{ color: '#475569', fontWeight: 600 }}>{item.packSize}</td>
                    <td style={{ textAlign: 'center', fontWeight: 800, color: '#056835' }}>{item.qty}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>₹{item.price.toLocaleString()}</td>
                    <td style={{ textAlign: 'right', fontWeight: 900, color: '#0F172A' }}>
                      ₹{(item.price * item.qty).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Total Calculation Area */}
            <div className="receipt-summary-container">
              <div className="receipt-guarantee-note">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#056835', fontWeight: 800, fontSize: '0.88rem' }}>
                  <ShieldCheck size={18} />
                  <span>100% BST Quality Guarantee</span>
                </div>
                <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '4px 0 0' }}>
                  Fresh dairy products dispatched directly from BST processing unit. Check temperature and packaging upon receipt.
                </p>
              </div>

              <div className="receipt-totals-box">
                <div className="total-row">
                  <span>Subtotal Amount:</span>
                  <span>₹{totalPrice.toLocaleString()}</span>
                </div>
                <div className="total-row">
                  <span>Delivery Charge:</span>
                  <span style={{ color: '#16A34A', fontWeight: 800 }}>FREE</span>
                </div>
                <div className="total-row grand-total">
                  <span>Total Payable:</span>
                  <span>₹{totalPrice.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Footer Stamp */}
            <div className="receipt-footer-stamp">
              <div>
                <p style={{ fontWeight: 800, color: '#056835', margin: 0 }}>THANK YOU FOR YOUR BUSINESS!</p>
                <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '2px 0 0' }}>
                  For inquiries or repeat orders, contact +91 99496 94030
                </p>
              </div>
              <div className="stamp-verified-badge">
                <CheckCircle2 size={16} /> VERIFIED BILL
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons Bar */}
        <div className="receipt-actions-bar">
          <button 
            type="button" 
            onClick={handleDownloadImage} 
            disabled={isDownloading}
            className="receipt-btn primary"
          >
            <Download size={18} />
            <span>{isDownloading ? 'Generating Image...' : 'Download Image Receipt (PNG)'}</span>
          </button>

          <button 
            type="button" 
            onClick={handleSendWhatsApp} 
            className="receipt-btn whatsapp"
          >
            <MessageCircle size={18} />
            <span>Share & Send on WhatsApp</span>
          </button>

          <button 
            type="button" 
            onClick={onClose} 
            className="receipt-btn secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
