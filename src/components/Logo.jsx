import React from 'react';

export const Logo = ({ size = 48, showText = true }) => {
  return (
    <div className="bst-logo-container" style={{ display: 'inline-flex', alignItems: 'center', gap: '12px' }}>
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 400 400" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0, filter: 'drop-shadow(0 3px 6px rgba(5,104,53,0.15))' }}
      >
        <defs>
          <linearGradient id="bstBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#056835" />
            <stop offset="60%" stopColor="#0C8A43" />
            <stop offset="100%" stopColor="#033A1D" />
          </linearGradient>
          <linearGradient id="sunGoldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="100%" stopColor="#EAB308" />
          </linearGradient>
          <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#86EFAC" />
            <stop offset="100%" stopColor="#22C55E" />
          </linearGradient>
        </defs>

        {/* Outer Ring */}
        <circle cx="200" cy="200" r="192" fill="#FFFFFF" stroke="#056835" strokeWidth="8" />
        <circle cx="200" cy="200" r="180" fill="url(#bstBgGrad)" />

        {/* Decorative Gold Inner Accent Arc */}
        <circle cx="200" cy="200" r="168" fill="none" stroke="url(#sunGoldGrad)" strokeWidth="4" strokeDasharray="12 6" opacity="0.6" />

        {/* Fresh Green Leaf Icon top-left */}
        <g transform="translate(70, 70) scale(0.85)">
          <path d="M50 70 Q10 20 0 0 Q40 0 70 30 Q60 60 50 70 Z" fill="url(#leafGrad)" stroke="#FFFFFF" strokeWidth="3" />
        </g>

        {/* Bold BST Brand Text */}
        <text 
          x="200" 
          y="215" 
          textAnchor="middle" 
          fill="#FFFFFF" 
          fontSize="115" 
          fontWeight="900" 
          fontFamily="'Outfit', 'Arial Black', sans-serif"
          letterSpacing="1"
        >
          BST
        </text>

        {/* Golden Tagline Text with Clean Spacing */}
        <text 
          x="200" 
          y="275" 
          textAnchor="middle" 
          fill="#FACC15" 
          fontSize="22" 
          fontWeight="800" 
          fontFamily="'Plus Jakarta Sans', sans-serif"
          letterSpacing="3"
        >
          AGRO & DAIRY
        </text>
      </svg>

      {showText && (
        <div className="logo-text-group" style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', whiteSpace: 'nowrap', flexShrink: 0 }}>
          <span className="logo-main-text" style={{ fontSize: '1.25rem', fontWeight: '900', color: '#056835', lineHeight: 1.15, letterSpacing: '-0.3px', whiteSpace: 'nowrap' }}>
            BST <span style={{ color: '#D97706' }}>AGRO & DAIRY</span>
          </span>
          <span className="logo-sub-text" style={{ fontSize: '0.72rem', fontWeight: '800', color: '#64748B', letterSpacing: '0.5px', marginTop: '2px', whiteSpace: 'nowrap' }}>
            Wholesale & Retail Portal
          </span>
        </div>
      )}
    </div>
  );
};
