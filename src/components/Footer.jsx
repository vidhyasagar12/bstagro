import React from 'react';
import { Logo } from './Logo';
import { ShieldCheck, Phone, MapPin, Clock, Heart } from 'lucide-react';

export const Footer = () => {
  return (
    <footer style={{ background: '#FFFFFF', borderTop: '1px solid #E2E8F0', paddingTop: '3rem', paddingBottom: '2rem', marginTop: '4rem' }}>
      <div style={{ maxWidth: '1380px', margin: '0 auto', padding: '0 1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem' }}>
        
        <div>
          <Logo size={40} showText={true} />
          <p style={{ fontSize: '0.88rem', color: '#64748B', marginTop: '0.85rem', lineHeight: '1.6' }}>
            <strong>BST AGRO AND DAIRY FOODS</strong> is a direct dairy manufacturer and authorized wholesale distributor delivering farm-fresh cottage paneer, khova, milk, butter, and cheese.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.85rem', color: '#056835', fontWeight: '800', fontSize: '0.82rem' }}>
            <ShieldCheck size={16} />
            <span>FSSAI Certified Fresh Cold-Chain Supply</span>
          </div>
        </div>

        <div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: '900', color: '#0F172A', textTransform: 'uppercase', marginBottom: '0.85rem' }}>
            Brands We Supply
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.88rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <li>🟢 <strong>BST Agro & Dairy</strong> (In-House Fresh Paneer & Khova)</li>
            <li>🥛 <strong>Amul</strong> (Salted Butter & Cheese Blocks)</li>
            <li>🧀 <strong>Milky Mist</strong> (Mozzarella, Toned Milk, Paneer)</li>
            <li>🧈 <strong>Nutralite Doodh Shakti</strong> (White Butter & Spreads)</li>
            <li>🌯 <strong>Goodrich Foods</strong> (Cheese Slices & Wraps)</li>
            <li>🛢️ <strong>Sri Murugan</strong> (Pure Cow Ghee)</li>
          </ul>
        </div>

        <div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: '900', color: '#0F172A', textTransform: 'uppercase', marginBottom: '0.85rem' }}>
            Store Helpline & Contact
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.88rem', color: '#475569' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Phone size={16} color="#056835" />
              <span><strong>Bhaskar Reddy:</strong> +91 99496 94030</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={16} color="#056835" />
              <span>Store Support: 5:30 AM – 9:00 PM Daily</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <MapPin size={16} color="#056835" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>Dairy Processing Unit & Wholesale Cold Storage Network</span>
            </div>
          </div>
        </div>

      </div>

      <div style={{ maxWidth: '1380px', margin: '2rem auto 0', padding: '1.25rem 1.5rem 0', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', fontSize: '0.82rem', color: '#64748B' }}>
        <div>
          © {new Date().getFullYear()} BST AGRO AND DAIRY FOODS. All Rights Reserved.
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <a href="#admin" style={{ color: '#94A3B8', textDecoration: 'none', fontWeight: '700' }}>Admin Portal</a>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span>Delivering pure quality with passion</span>
            <Heart size={14} fill="#EF4444" color="#EF4444" />
          </div>
        </div>
      </div>
    </footer>
  );
};
