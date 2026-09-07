import React from 'react';
import { Phone, MessageCircle, HeartHandshake } from 'lucide-react';

export const DeliveryTopBar = () => {
  const whatsappUrl = "https://wa.me/919949694030?text=" + encodeURIComponent("Hello Bhaskar Reddy, I have an inquiry for BST Agro & Dairy products.");

  return (
    <div className="delivery-topbar">
      <div className="topbar-left">
        <span className="topbar-badge">
          <HeartHandshake size={14} /> Direct Factory & Wholesale Supply
        </span>
        <span className="topbar-tagline">
          Pure Fresh Cottage Paneer, Khova, Milk, Ghee, Butter & Cheese
        </span>
      </div>

      <div className="topbar-right">
        <a href="tel:+919949694030" className="topbar-link call-link">
          <Phone size={14} color="#4ADE80" />
          <span>Order Helpline: <strong>+91 99496 94030</strong></span>
        </a>
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="topbar-link whatsapp-link">
          <MessageCircle size={14} color="#25D366" />
          <span>WhatsApp Order: <strong>+91 99496 94030</strong></span>
        </a>
      </div>
    </div>
  );
};
