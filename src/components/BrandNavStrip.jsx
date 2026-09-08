import React from 'react';
import { Building2 } from 'lucide-react';

export const BrandNavStrip = ({ selectedBrand, setSelectedBrand, productCounts, brands = [] }) => {
  return (
    <div className="brand-nav-strip">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', paddingRight: '0.5rem', borderRight: '1px solid #E2E8F0', color: '#64748B', fontSize: '0.82rem', fontWeight: 800, flexShrink: 0 }}>
        <Building2 size={16} color="#056835" />
        <span>BRANDS:</span>
      </div>

      {brands.map(brand => {
        const isActive = selectedBrand === brand.id;
        const count = productCounts[brand.id] !== undefined 
          ? productCounts[brand.id] 
          : (brand.id === 'all' ? (productCounts.all || 0) : 0);

        return (
          <button
            key={brand.id}
            onClick={() => setSelectedBrand(brand.id)}
            className={`brand-chip ${isActive ? 'active' : ''}`}
            style={{
              background: isActive ? brand.bgColor : undefined,
              borderColor: isActive ? brand.bgColor : undefined
            }}
          >
            <span>{brand.logoBadge}</span>
            {brand.isOwnBrand && (
              <span style={{ background: '#FACC15', color: '#000', padding: '1px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: '900' }}>
                OUR BRAND
              </span>
            )}
            <span style={{ opacity: 0.8, fontSize: '0.78rem' }}>({count})</span>
          </button>
        );
      })}
    </div>
  );
};
