// Products - Loaded dynamically from Supabase API
export const PRODUCTS = [];

export const BRANDS = [
  {
    id: "all",
    name: "All Companies",
    logoBadge: "🏢 All Brands",
    isOwnBrand: false,
    bgColor: "#056835",
    textColor: "#ffffff"
  },
  {
    id: "bst",
    name: "BST Agro & Dairy",
    logoBadge: "🟢 BST Dairy",
    isOwnBrand: true,
    bgColor: "#056835",
    textColor: "#ffffff",
    description: "Our in-house farm-fresh dairy unit producing pure cottage paneer and khova daily."
  },
  {
    id: "amul",
    name: "Amul",
    logoBadge: "🥛 Amul",
    isOwnBrand: false,
    bgColor: "#dc2626",
    textColor: "#ffffff",
    description: "Leading national dairy brand for salted butter and processed cheese blocks."
  },
  {
    id: "milkymist",
    name: "Milky Mist",
    logoBadge: "🧀 Milky Mist",
    isOwnBrand: false,
    bgColor: "#1d4ed8",
    textColor: "#ffffff",
    description: "Specialists in UHT toned milk, mozzarella diced pizza cheese, and packaged paneer."
  },
  {
    id: "doodhshakti",
    name: "Nutralite / Doodh Shakti",
    logoBadge: "🧈 Doodh Shakti",
    isOwnBrand: false,
    bgColor: "#0284c7",
    textColor: "#ffffff",
    description: "Commercial white unsalted butter, salted butter boxes, and healthy fat spreads."
  },
  {
    id: "goodrich",
    name: "Goodrich",
    logoBadge: "🌯 Goodrich",
    isOwnBrand: false,
    bgColor: "#d97706",
    textColor: "#ffffff",
    description: "Cheese slices and 8.5-inch tortilla wraps for restaurants and food courts."
  },
  {
    id: "srimurugan",
    name: "Sri Murugan",
    logoBadge: "🛢️ Sri Murugan",
    isOwnBrand: false,
    bgColor: "#b45309",
    textColor: "#ffffff",
    description: "Pure granulated cow ghee crafted for traditional Indian cuisine."
  },
  {
    id: "realroots",
    name: "Realroots / Agro Fresh",
    logoBadge: "🍄 Realroots",
    isOwnBrand: false,
    bgColor: "#15803d",
    textColor: "#ffffff",
    description: "Button mushrooms (canned & fresh) and crispy golden fried onion (Birista)."
  },
  {
    id: "vintage",
    name: "Vintage Agro",
    logoBadge: "🧁 Vintage",
    isOwnBrand: false,
    bgColor: "#7c2d12",
    textColor: "#ffffff",
    description: "Bulk 5kg khova packs for sweet makers and commercial bakeries."
  },
  {
    id: "arabian",
    name: "Arabian Specialties",
    logoBadge: "🍇 Arabian",
    isOwnBrand: false,
    bgColor: "#6b21a8",
    textColor: "#ffffff",
    description: "Pulpy grape fruit drink pulp and concentrates."
  }
];

export const CATEGORIES = [
  "All Categories",
  "Paneer & Khova",
  "Cheese & Butter",
  "Dairy & Milk",
  "Dairy & Ghee",
  "Prepared Foods & Bakery",
  "Fresh Agro & Canned",
  "Beverages & Pulps"
];
