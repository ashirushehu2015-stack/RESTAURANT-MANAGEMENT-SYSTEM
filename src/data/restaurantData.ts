import type { RestaurantMenuItem, RestaurantOrder, InventoryItem, Supplier, PurchaseOrder } from '../types';

export const INITIAL_MENU_ITEMS: RestaurantMenuItem[] = [
  // --- FOOD MENU ---
  {
    id: 'food-001',
    name: 'White Rice',
    category: 'FOOD MENU',
    price: 3000,
    description: 'Freshly steamed fluffy long grain white rice served with savory house sauce.',
    imageUrl: 'https://gen-lang-client-0229192156.web.app/menu-images/white_rice.jpg',
    available: true,
    prepTimeMinutes: 10,
    isChefSpecial: false
  },
  {
    id: 'food-002',
    name: 'Jollof Rice',
    category: 'FOOD MENU',
    price: 3000,
    description: 'Classic smoky Nigerian party Jollof rice prepared with rich tomato and pepper blend.',
    imageUrl: 'https://gen-lang-client-0229192156.web.app/menu-images/jollof_rice.jpg',
    available: true,
    prepTimeMinutes: 10,
    isChefSpecial: true
  },
  {
    id: 'food-003',
    name: 'Semovita',
    category: 'FOOD MENU',
    price: 3500,
    description: 'Smooth, soft semolina swallow served with rich house soup.',
    imageUrl: 'https://gen-lang-client-0229192156.web.app/menu-images/semovita.jpg',
    available: true,
    prepTimeMinutes: 15
  },
  {
    id: 'food-004',
    name: 'Garri',
    category: 'FOOD MENU',
    price: 3000,
    description: 'Traditional cassava swallow (Eba) served warm.',
    imageUrl: 'https://gen-lang-client-0229192156.web.app/menu-images/garri.jpg',
    available: true,
    prepTimeMinutes: 10
  },
  {
    id: 'food-005',
    name: 'Tuwon Shinkafa',
    category: 'FOOD MENU',
    price: 3200,
    description: 'Authentic Northern soft rice swallow.',
    imageUrl: 'https://gen-lang-client-0229192156.web.app/menu-images/tuwon_shinkafa.jpg',
    available: true,
    prepTimeMinutes: 15,
    isChefSpecial: true
  },
  {
    id: 'food-006',
    name: 'Pepper Soup',
    category: 'FOOD MENU',
    price: 5000,
    description: 'Aromatic piping hot herbal pepper broth infused with traditional spices.',
    imageUrl: 'https://gen-lang-client-0229192156.web.app/menu-images/pepper_soup.jpg',
    available: true,
    prepTimeMinutes: 15,
    isSpicy: true
  },
  {
    id: 'food-007',
    name: 'Indomie and Egg',
    category: 'FOOD MENU',
    price: 2500,
    description: 'Stir-fried seasoned Indomie noodles served with two fried or boiled eggs.',
    imageUrl: 'https://gen-lang-client-0229192156.web.app/menu-images/indomie_egg.jpg',
    available: true,
    prepTimeMinutes: 10
  },
  {
    id: 'food-008',
    name: 'Yam and Eggsauce',
    category: 'FOOD MENU',
    price: 3500,
    description: 'Boiled tender white yam slabs served with rich tomato egg sauce.',
    imageUrl: 'https://gen-lang-client-0229192156.web.app/menu-images/yam_eggsauce.jpg',
    available: true,
    prepTimeMinutes: 15
  },
  {
    id: 'food-009',
    name: 'Chips and Egg',
    category: 'FOOD MENU',
    price: 3500,
    description: 'Golden crispy potato chips served with seasoned fried eggs.',
    available: true,
    prepTimeMinutes: 12
  },
  {
    id: 'food-010',
    name: 'Pasta and Beef',
    category: 'FOOD MENU',
    price: 3000,
    description: 'Savorily cooked spaghetti pasta tossed with tender spiced beef pieces.',
    available: true,
    prepTimeMinutes: 15
  },
  {
    id: 'food-011',
    name: 'Pancake and Tea',
    category: 'FOOD MENU',
    price: 3000,
    description: 'Fluffy golden pancakes served with hot steeped tea.',
    available: true,
    prepTimeMinutes: 12
  },
  {
    id: 'food-012',
    name: 'Salad',
    category: 'FOOD MENU',
    price: 500,
    description: 'Fresh crisp garden vegetable salad mix.',
    available: true,
    prepTimeMinutes: 5
  },

  // --- SNACKS ---
  {
    id: 'snack-001',
    name: 'Pizza (Large Potion)',
    category: 'SNACKS',
    price: 13000,
    description: 'Large freshly baked pizza topped with rich mozzarella, veggies, and meat.',
    available: true,
    prepTimeMinutes: 25,
    isChefSpecial: true
  },
  {
    id: 'snack-002',
    name: 'Pizza (Medium Potion)',
    category: 'SNACKS',
    price: 11000,
    description: 'Medium freshly baked pizza loaded with cheese and toppings.',
    available: true,
    prepTimeMinutes: 20
  },
  {
    id: 'snack-003',
    name: 'Pizza (Small Potion)',
    category: 'SNACKS',
    price: 8000,
    description: 'Small freshly baked pizza.',
    available: true,
    prepTimeMinutes: 15
  },
  {
    id: 'snack-004',
    name: 'Chicken Shawarma Double Sausage',
    category: 'SNACKS',
    price: 4000,
    description: 'Juicy chicken wrap filled with garlic cream sauce, cabbage, and double sausages.',
    available: true,
    prepTimeMinutes: 15,
    isChefSpecial: true
  },
  {
    id: 'snack-005',
    name: 'Beef Shawarma',
    category: 'SNACKS',
    price: 3500,
    description: 'Tender spiced beef shawarma wrap.',
    available: true,
    prepTimeMinutes: 12
  },
  {
    id: 'snack-006',
    name: 'No Sausage Shawarma',
    category: 'SNACKS',
    price: 3000,
    description: 'Delightful shawarma wrap without sausages.',
    available: true,
    prepTimeMinutes: 12
  },
  {
    id: 'snack-007',
    name: 'Meat pie',
    category: 'SNACKS',
    price: 1000,
    description: 'Golden buttery pastry pocket filled with minced spiced meat and potatoes.',
    available: true,
    prepTimeMinutes: 2
  },
  {
    id: 'snack-008',
    name: 'Fish Roll',
    category: 'SNACKS',
    price: 1000,
    description: 'Crispy fried pastry roll stuffed with seasoned minced fish.',
    available: true,
    prepTimeMinutes: 2
  },
  {
    id: 'snack-009',
    name: 'Bunce',
    category: 'SNACKS',
    price: 300,
    description: 'Soft sweet fried pastry ball.',
    available: true,
    prepTimeMinutes: 2
  },
  {
    id: 'snack-010',
    name: 'Tea',
    category: 'SNACKS',
    price: 1700,
    description: 'Piping hot brewed milk tea or black tea.',
    available: true,
    prepTimeMinutes: 5
  },

  // --- PROTEIN ---
  {
    id: 'prot-001',
    name: 'Peppered Chicken',
    category: 'PROTEIN',
    price: 3500,
    description: 'Succulent fried chicken piece tossed in fiery pepper sauce.',
    available: true,
    prepTimeMinutes: 10,
    isSpicy: true,
    isChefSpecial: true
  },
  {
    id: 'prot-002',
    name: 'Fish',
    category: 'PROTEIN',
    price: 1500,
    description: 'Deep fried or peppered fish portion.',
    available: true,
    prepTimeMinutes: 10
  },
  {
    id: 'prot-003',
    name: 'Beef',
    category: 'PROTEIN',
    price: 1000,
    description: 'Tender stewed or fried spiced beef portion.',
    available: true,
    prepTimeMinutes: 5
  },

  // --- DRINKS ---
  {
    id: 'drk-001',
    name: 'Fayrouz',
    category: 'DRINKS',
    price: 800,
    description: 'Chilled sparkling soft drink.',
    available: true,
    prepTimeMinutes: 2
  },
  {
    id: 'drk-002',
    name: 'Schwepps',
    category: 'DRINKS',
    price: 800,
    description: 'Refreshing carbonated bitter lemon or tonic water.',
    available: true,
    prepTimeMinutes: 2
  },
  {
    id: 'drk-003',
    name: 'Power Horse',
    category: 'DRINKS',
    price: 1700,
    description: 'Energy drink served ice cold.',
    available: true,
    prepTimeMinutes: 2
  },
  {
    id: 'drk-004',
    name: 'Coke',
    category: 'DRINKS',
    price: 500,
    description: 'Chilled 50cl Coca-Cola bottle.',
    available: true,
    prepTimeMinutes: 2
  },
  {
    id: 'drk-005',
    name: 'Fanta',
    category: 'DRINKS',
    price: 500,
    description: 'Chilled 50cl Fanta Orange bottle.',
    available: true,
    prepTimeMinutes: 2
  },
  {
    id: 'drk-006',
    name: 'Sprite',
    category: 'DRINKS',
    price: 500,
    description: 'Chilled 50cl Sprite bottle.',
    available: true,
    prepTimeMinutes: 2
  },
  {
    id: 'drk-007',
    name: 'Malt',
    category: 'DRINKS',
    price: 800,
    description: 'Chilled premium malt drink.',
    available: true,
    prepTimeMinutes: 2
  },
  {
    id: 'drk-008',
    name: 'Yoghourt (35cl)',
    category: 'DRINKS',
    price: 1500,
    description: 'Creamy fresh yoghurt drink 35cl.',
    available: true,
    prepTimeMinutes: 2
  },
  {
    id: 'drk-009',
    name: 'Coconut Yoghourt (35cl)',
    category: 'DRINKS',
    price: 2000,
    description: 'Rich coconut-infused yoghurt drink 35cl.',
    available: true,
    prepTimeMinutes: 2
  },
  {
    id: 'drk-010',
    name: 'Big Yoghourt (50cl)',
    category: 'DRINKS',
    price: 2500,
    description: 'Creamy fresh yoghurt drink 50cl.',
    available: true,
    prepTimeMinutes: 2
  },
  {
    id: 'drk-011',
    name: 'Big Coconut Yoghourt (50cl)',
    category: 'DRINKS',
    price: 3000,
    description: 'Rich coconut-infused yoghurt drink 50cl.',
    available: true,
    prepTimeMinutes: 2
  },
  {
    id: 'drk-012',
    name: 'Predator',
    category: 'DRINKS',
    price: 600,
    description: 'Energy drink served chilled.',
    available: true,
    prepTimeMinutes: 2
  },
  {
    id: 'drk-013',
    name: 'Exotic',
    category: 'DRINKS',
    price: 2500,
    description: 'Chilled Chivita Exotic fruit juice pack.',
    available: true,
    prepTimeMinutes: 2
  },
  {
    id: 'drk-014',
    name: 'Hollandia',
    category: 'DRINKS',
    price: 2500,
    description: 'Rich Hollandia yoghurt drink.',
    available: true,
    prepTimeMinutes: 2
  },
  {
    id: 'drk-015',
    name: '5Alive',
    category: 'DRINKS',
    price: 2000,
    description: '5Alive citrus or berry fruit drink pack.',
    available: true,
    prepTimeMinutes: 2
  },
  {
    id: 'drk-016',
    name: 'Fearless',
    category: 'DRINKS',
    price: 600,
    description: 'Fearless energy drink.',
    available: true,
    prepTimeMinutes: 2
  },
  {
    id: 'drk-017',
    name: 'Orange Juice',
    category: 'DRINKS',
    price: 1200,
    description: 'Fresh chilled orange juice.',
    available: true,
    prepTimeMinutes: 5
  },
  {
    id: 'drk-018',
    name: 'Water Melon Juice',
    category: 'DRINKS',
    price: 1200,
    description: 'Fresh pressed cold watermelon juice.',
    available: true,
    prepTimeMinutes: 5
  },

  // --- OFF-SITE CENTRAL KITCHEN REGISTERED MENU ITEMS ---
  {
    id: 'kitch-001',
    name: 'Special Suya Platter (Off-Site Grill)',
    category: 'Grill & Suya Special',
    price: 4500,
    description: 'Charcoal-grilled tender spiced beef suya prepared at Central Kitchen.',
    available: true,
    prepTimeMinutes: 20,
    isSpicy: true,
    isChefSpecial: true,
    establishment: 'central_kitchen'
  },
  {
    id: 'kitch-002',
    name: 'Central Kitchen Kilishi & Spice Pack',
    category: 'Grill & Suya Special',
    price: 5000,
    description: 'Sun-dried seasoned beef jerky prepared at off-site production line.',
    available: true,
    prepTimeMinutes: 10,
    isChefSpecial: true,
    establishment: 'central_kitchen'
  },
  {
    id: 'kitch-003',
    name: 'Catfish Pepper Soup (Central Kitchen Special)',
    category: 'Soups & Delicacies',
    price: 7500,
    description: 'Whole fresh catfish simmered in herbal pepper broth.',
    available: true,
    prepTimeMinutes: 25,
    isSpicy: true,
    isChefSpecial: true,
    establishment: 'central_kitchen'
  },
  {
    id: 'kitch-004',
    name: 'Bulk Catering Tuwon Shinkafa & Miyan Kuka',
    category: 'Main Course & Swallows',
    price: 4000,
    description: 'Authentic northern rice swallow with baobab soup cooked at Central Kitchen.',
    available: true,
    prepTimeMinutes: 15,
    establishment: 'central_kitchen'
  },
  {
    id: 'kitch-005',
    name: 'Central Kitchen Fresh Zobo & Ginger Drink (1 Litre)',
    category: 'Beverages & Drinks',
    price: 2000,
    description: 'Chilled hibiscus flower and spicy ginger juice freshly brewed at Central Kitchen.',
    available: true,
    prepTimeMinutes: 5,
    establishment: 'central_kitchen'
  }
];

export const INITIAL_RESTAURANT_ORDERS: RestaurantOrder[] = [
  {
    id: 'ORD-2026-0101',
    tableOrRoom: 'Table 03',
    orderType: 'Dine-In',
    items: [
      { menuItem: INITIAL_MENU_ITEMS[1], quantity: 2 }, // Jollof Rice
      { menuItem: INITIAL_MENU_ITEMS[22], quantity: 2 }, // Peppered Chicken
      { menuItem: INITIAL_MENU_ITEMS[28], quantity: 2 }  // Coke
    ],
    subtotal: 14000,
    tax: 700,
    serviceCharge: 0,
    grandTotal: 14700,
    paymentMethod: 'POS Machine',
    paymentStatus: 'Paid',
    kitchenStatus: 'Served',
    createdAt: '2026-08-02 11:30 AM',
    cashierName: 'Aisha Garba',
    customerName: 'Alhaji Umar Sanusi'
  },
  {
    id: 'ORD-2026-0102',
    tableOrRoom: 'Room 108 (VIP)',
    orderType: 'Room Delivery',
    items: [
      { menuItem: INITIAL_MENU_ITEMS[12], quantity: 1 }, // Pizza Large
      { menuItem: INITIAL_MENU_ITEMS[30], quantity: 2 }  // Malt
    ],
    subtotal: 14600,
    tax: 730,
    serviceCharge: 300, // Room service at N300
    grandTotal: 15630,
    paymentMethod: 'Cash',
    paymentStatus: 'Paid',
    kitchenStatus: 'Preparing',
    createdAt: '2026-08-02 12:15 PM',
    cashierName: 'Sarkin Fulani',
    customerName: 'Chief Emeka Okafor'
  }
];

export const INITIAL_INVENTORY_ITEMS: InventoryItem[] = [
  {
    id: "INV-001",
    name: "Rice (Long Grain)",
    category: "Raw Ingredients",
    unit: "bags",
    quantityInStock: 12,
    minimumThreshold: 5,
    costPerUnit: 45000,
    supplier: "Olam Agro",
    lastRestocked: "2026-08-10"
  },
  {
    id: "INV-002",
    name: "Vegetable Cooking Oil",
    category: "Raw Ingredients",
    unit: "liters",
    quantityInStock: 8,
    minimumThreshold: 20,
    costPerUnit: 2500,
    supplier: "Kings Oil Distributors",
    lastRestocked: "2026-08-01"
  },
  {
    id: "INV-003",
    name: "Beef (Boneless)",
    category: "Raw Ingredients",
    unit: "kg",
    quantityInStock: 15,
    minimumThreshold: 10,
    costPerUnit: 3500,
    supplier: "Local Abattoir Co.",
    lastRestocked: "2026-08-15"
  },
  {
    id: "INV-004",
    name: "Coca-Cola (Glass Bottle)",
    category: "Beverages",
    unit: "crates",
    quantityInStock: 30,
    minimumThreshold: 15,
    costPerUnit: 2400,
    supplier: "NBC Ltd.",
    lastRestocked: "2026-08-12"
  },
  {
    id: "INV-005",
    name: "Takeaway Packs (Medium)",
    category: "Packaging",
    unit: "packs",
    quantityInStock: 2,
    minimumThreshold: 5,
    costPerUnit: 8000,
    supplier: "Golden Plastics",
    lastRestocked: "2026-07-28"
  },
  {
    id: "INV-006",
    name: "Fresh Tomatoes",
    category: "Raw Ingredients",
    unit: "kg",
    quantityInStock: 4,
    minimumThreshold: 10,
    costPerUnit: 1200,
    supplier: "Mile 12 Market",
    lastRestocked: "2026-08-16"
  }
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: "SUP-001",
    name: "GreenValley Fresh Produce",
    category: "Vegetables & Fruits",
    contactPerson: "Alhaji Musa",
    phone: "+234 801 234 5678",
    email: "sales@greenvalley.ng",
    status: "Active"
  },
  {
    id: "SUP-002",
    name: "Prime Cuts Butchery",
    category: "Meat & Poultry",
    contactPerson: "Chef Kunle",
    phone: "+234 802 345 6789",
    email: "orders@primecuts.com",
    status: "Active"
  },
  {
    id: "SUP-003",
    name: "Oceanic Seafoods Ltd",
    category: "Seafood",
    contactPerson: "Madam Stella",
    phone: "+234 803 456 7890",
    email: "info@oceanicseafoods.ng",
    status: "Active"
  },
  {
    id: "SUP-004",
    name: "Naija Beverage Corp",
    category: "Beverages",
    contactPerson: "Tunde Bakare",
    phone: "+234 804 567 8901",
    email: "distrib@naijabev.com",
    status: "Active"
  },
  {
    id: "SUP-005",
    name: "City Packagings",
    category: "Packaging",
    contactPerson: "Emeka Uche",
    phone: "+234 805 678 9012",
    email: "sales@citypack.com.ng",
    status: "Inactive"
  }
];

export const INITIAL_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: "PO-26-001",
    supplierId: "SUP-002",
    supplierName: "Prime Cuts Butchery",
    description: "Weekly Beef & Chicken Supply",
    totalAmount: 450000,
    orderDate: "2026-08-10",
    expectedDelivery: "2026-08-12",
    status: "Paid"
  },
  {
    id: "PO-26-002",
    supplierId: "SUP-001",
    supplierName: "GreenValley Fresh Produce",
    description: "Tomatoes, Onions, Peppers (Sacks)",
    totalAmount: 125000,
    orderDate: "2026-08-15",
    expectedDelivery: "2026-08-17",
    status: "Received"
  },
  {
    id: "PO-26-003",
    supplierId: "SUP-004",
    supplierName: "Naija Beverage Corp",
    description: "Soft Drinks & Water Restock",
    totalAmount: 85000,
    orderDate: "2026-08-16",
    expectedDelivery: "2026-08-18",
    status: "Pending"
  },
  {
    id: "PO-26-004",
    supplierId: "SUP-003",
    supplierName: "Oceanic Seafoods Ltd",
    description: "Fresh Tilapia & Catfish",
    totalAmount: 210000,
    orderDate: "2026-08-17",
    expectedDelivery: "2026-08-19",
    status: "Pending"
  }
];
