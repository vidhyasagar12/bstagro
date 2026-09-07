import React from 'react';
import { CATEGORIES } from '../data/products';
import { Layers, CheckCircle } from 'lucide-react';

const CATEGORY_ICONS = {
  "All Categories": "🛍️",
  "Paneer & Khova": "🧈",
  "Cheese & Butter": "🧀",
  "Dairy & Milk": "🥛",
  "Dairy & Ghee": "🍯",
  "Prepared Foods & Bakery": "🍞",
  "Fresh Agro & Canned": "🍄",
  "Beverages & Pulps": "🍇"
};

export const CategorySidebar = ({ selectedCategory, setSelectedCategory, categoryCounts }) => {
  return (
    <aside className="category-sidebar">
      <div className="sidebar-title">
        <Layers size={18} color="#056835" />
        <span>Product Categories</span>
      </div>

      <ul className="sidebar-list">
        {CATEGORIES.map(cat => {
          const isActive = selectedCategory === cat;
          const count = categoryCounts[cat] || 0;
          const icon = CATEGORY_ICONS[cat] || "📦";

          return (
            <li
              key={cat}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.1rem' }}>{icon}</span>
                <span className="cat-name">{cat}</span>
              </div>
              <span className="cat-count-badge">{count}</span>
            </li>
          );
        })}
      </ul>
    </aside>
  );
};
