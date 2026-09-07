import React from 'react';
import { MessageCircle } from 'lucide-react';

export const FloatingWhatsAppBtn = () => {
  const whatsappUrl = "https://wa.me/919949694030?text=" + encodeURIComponent("Hello Bhaskar Reddy, I am browsing the BST Agro & Dairy website and want to ask about product availability and orders.");

  return (
    <a 
      href={whatsappUrl} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="floating-wa-btn"
      title="Chat & Order on WhatsApp (+91 99496 94030)"
    >
      <MessageCircle size={28} />
      <span className="floating-wa-text">Chat on WhatsApp</span>
    </a>
  );
};
