const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'offline_storage.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const getDefaultMenuItems = () => [
  { _id: 'item-01', cafe: 'offline-cafe-02', name: 'Espresso Romano', category: 'Beverages', price: 180, isVeg: true, isAvailable: true, description: 'Double shot espresso served with a slice of candied lemon peel', preparationTime: 5, sortOrder: 1 },
  { _id: 'item-02', cafe: 'offline-cafe-02', name: 'Cold Brew Float', category: 'Beverages', price: 240, isVeg: true, isAvailable: true, description: '16-hour slow steeped cold brew topped with Madagascan vanilla gelato', preparationTime: 6, sortOrder: 2 },
  { _id: 'item-03', cafe: 'offline-cafe-02', name: 'Passion Fruit Iced Tea', category: 'Beverages', price: 210, isVeg: true, isAvailable: true, description: 'Freshly brewed black tea infused with passion fruit pulp and mint', preparationTime: 5, sortOrder: 3 },
  { _id: 'item-04', cafe: 'offline-cafe-02', name: 'Truffle Parmesan Fries', category: 'Snacks', price: 260, isVeg: true, isAvailable: true, description: 'Hand-cut crisp potato fries tossed in white truffle oil and aged parmesan', preparationTime: 12, sortOrder: 4 },
  { _id: 'item-05', cafe: 'offline-cafe-02', name: 'Garlic Herb Sourdough Toast', category: 'Snacks', price: 190, isVeg: true, isAvailable: true, description: 'Toasted artisan sourdough with confit garlic butter and oregano', preparationTime: 10, sortOrder: 5 },
  { _id: 'item-06', cafe: 'offline-cafe-02', name: 'Paneer Tikka Panini', category: 'Main Course', price: 340, isVeg: true, isAvailable: true, description: 'Charcoal grilled cottage cheese, bell peppers, mint chutney in pressed panini', preparationTime: 15, sortOrder: 6 },
  { _id: 'item-07', cafe: 'offline-cafe-02', name: 'Grilled Chicken Ciabatta', category: 'Main Course', price: 380, isVeg: false, isAvailable: true, description: 'Herb marinated chicken breast, caramelized onions, smoked gouda, garlic aioli', preparationTime: 18, sortOrder: 7 },
  { _id: 'item-08', cafe: 'offline-cafe-02', name: 'Artisan Woodfired Margherita', category: 'Main Course', price: 420, isVeg: true, isAvailable: true, description: 'San Marzano tomatoes, fresh buffalo mozzarella, hand-torn sweet basil', preparationTime: 20, sortOrder: 8 },
  { _id: 'item-09', cafe: 'offline-cafe-02', name: 'Classic Tiramisu Cup', category: 'Desserts', price: 290, isVeg: true, isAvailable: true, description: 'Savoiardi ladyfingers soaked in espresso and marsala layered with mascarpone cream', preparationTime: 5, sortOrder: 9 },
  { _id: 'item-10', cafe: 'offline-cafe-02', name: 'Warm Belgian Chocolate Tart', category: 'Desserts', price: 310, isVeg: true, isAvailable: true, description: '70% dark Belgian chocolate ganache in crisp butter pastry crust', preparationTime: 8, sortOrder: 10 }
];

const getDefaultSessions = () => [
  {
    _id: 'sess-01',
    cafe: 'offline-cafe-02',
    tableNumber: 3,
    status: 'active',
    sessionCode: 'SES-03-A1B2',
    guestName: 'Rohit Sharma',
    guestPhone: '+91 98200 55441',
    pax: 2,
    openedAt: new Date(Date.now() - 25 * 60000).toISOString(),
    orders: ['ord-01'],
    subtotal: 740,
    taxAmount: 37,
    discountAmount: 0,
    grandTotal: 777,
    paymentStatus: 'Unpaid',
    notes: 'Near window table'
  },
  {
    _id: 'sess-02',
    cafe: 'offline-cafe-02',
    tableNumber: 7,
    status: 'billing',
    sessionCode: 'SES-07-C3D4',
    guestName: 'Aman Singhal',
    guestPhone: '+91 99110 44332',
    pax: 4,
    openedAt: new Date(Date.now() - 55 * 60000).toISOString(),
    billedAt: new Date(Date.now() - 5 * 60000).toISOString(),
    orders: ['ord-02'],
    subtotal: 1050,
    taxAmount: 52.5,
    discountAmount: 50,
    grandTotal: 1052.5,
    paymentStatus: 'Unpaid',
    notes: 'Split bill request'
  }
];

const getDefaultOrders = () => [
  {
    _id: 'ord-01',
    cafe: 'offline-cafe-02',
    sessionId: 'sess-01',
    orderSource: 'QR Scan',
    orderType: 'Dine-In',
    tableNumber: 3,
    customerName: 'Rohit Sharma',
    customerPhone: '+91 98200 55441',
    items: [
      { itemId: 'item-04', name: 'Truffle Parmesan Fries', price: 260, quantity: 1, isVeg: true },
      { itemId: 'item-02', name: 'Cold Brew Float', price: 240, quantity: 2, isVeg: true }
    ],
    itemTotal: 740,
    subtotal: 740,
    taxAmount: 37,
    discountAmount: 0,
    grandTotal: 777,
    status: 'Preparing',
    paymentStatus: 'Unpaid',
    paymentMethod: 'Cash',
    kotNumber: 'KOT-101',
    kotPrintedAt: new Date(Date.now() - 20 * 60000).toISOString(),
    createdAt: new Date(Date.now() - 24 * 60000).toISOString()
  },
  {
    _id: 'ord-02',
    cafe: 'offline-cafe-02',
    sessionId: 'sess-02',
    orderSource: 'Waiter POS',
    orderType: 'Dine-In',
    tableNumber: 7,
    customerName: 'Aman Singhal',
    customerPhone: '+91 99110 44332',
    items: [
      { itemId: 'item-06', name: 'Paneer Tikka Panini', price: 340, quantity: 1, isVeg: true },
      { itemId: 'item-08', name: 'Artisan Woodfired Margherita', price: 420, quantity: 1, isVeg: true },
      { itemId: 'item-09', name: 'Classic Tiramisu Cup', price: 290, quantity: 1, isVeg: true }
    ],
    itemTotal: 1050,
    subtotal: 1050,
    taxAmount: 52.5,
    discountAmount: 50,
    grandTotal: 1052.5,
    status: 'Ready',
    paymentStatus: 'Unpaid',
    paymentMethod: 'UPI',
    kotNumber: 'KOT-102',
    kotPrintedAt: new Date(Date.now() - 40 * 60000).toISOString(),
    createdAt: new Date(Date.now() - 50 * 60000).toISOString()
  },
  {
    _id: 'ord-03',
    cafe: 'offline-cafe-02',
    sessionId: null,
    orderSource: 'Counter POS',
    orderType: 'Takeaway',
    tableNumber: null,
    customerName: 'Kunal Kapoor',
    customerPhone: '+91 97112 33445',
    items: [
      { itemId: 'item-01', name: 'Espresso Romano', price: 180, quantity: 2, isVeg: true },
      { itemId: 'item-05', name: 'Garlic Herb Sourdough Toast', price: 190, quantity: 1, isVeg: true }
    ],
    itemTotal: 550,
    subtotal: 550,
    taxAmount: 27.5,
    discountAmount: 0,
    grandTotal: 577.5,
    status: 'Served',
    paymentStatus: 'Paid',
    paymentMethod: 'Card',
    kotNumber: 'KOT-103',
    invoiceNumber: 'INV-101',
    invoicePrintedAt: new Date(Date.now() - 10 * 60000).toISOString(),
    createdAt: new Date(Date.now() - 15 * 60000).toISOString()
  }
];

const getDefaultCoupons = () => [
  {
    _id: 'cpn-01',
    cafe: 'offline-cafe-02',
    code: 'WELCOME50',
    type: 'flat',
    value: 50,
    minOrder: 200,
    maxDiscount: 50,
    usageLimit: 100,
    usedCount: 14,
    isActive: true,
    expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString()
  },
  {
    _id: 'cpn-02',
    cafe: 'offline-cafe-02',
    code: 'FEAST15',
    type: 'percentage',
    value: 15,
    minOrder: 499,
    maxDiscount: 150,
    usageLimit: 50,
    usedCount: 8,
    isActive: true,
    expiresAt: new Date(Date.now() + 15 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString()
  }
];

// Initial seed data
const getInitialData = () => {
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync('Yugmittal@22', salt);

  return {
    users: [
      {
        _id: 'offline-admin-01',
        name: 'Super Admin',
        email: 'yugmittal689@gmail.com',
        password: hashedPassword,
        plainPassword: 'Yugmittal@22',
        role: 'superadmin',
        createdAt: new Date().toISOString(),
      },
    ],
    cafes: [
      {
        _id: 'offline-cafe-01',
        cafeId: 'CAFE-ROAST1',
        name: 'Artisan Coffee Roasters',
        ownerName: 'Vikram Sharma',
        phone: '+91 98765 43210',
        email: 'vikram@artisancoffee.in',
        address: '14, Galleria Market, DLF Phase 4',
        city: 'Gurugram',
        description: 'Specialty coffee & European bistro bakery',
        cuisine: ['Specialty Coffee', 'Bakery', 'Breakfast'],
        openTime: '08:00',
        closeTime: '23:00',
        tableCount: 16,
        isActive: true,
        createdBy: 'offline-admin-01',
        taxPercent: 5,
        taxLabel: 'GST',
        kotPrefix: 'KOT',
        invoicePrefix: 'INV',
        createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      },
      {
        _id: 'offline-cafe-02',
        cafeId: 'CAFE-GRILL2',
        name: 'Urban Hearth Bistro',
        ownerName: 'Priya Mehra',
        phone: '+91 98111 22334',
        email: 'priya@urbanhearth.com',
        address: 'Plot 42, Sector 29',
        city: 'Gurugram',
        description: 'Modern European dining & artisanal cocktails',
        cuisine: ['Continental', 'Italian', 'Grill'],
        openTime: '11:00',
        closeTime: '00:00',
        tableCount: 24,
        isActive: true,
        createdBy: 'offline-admin-01',
        taxPercent: 5,
        taxLabel: 'GST',
        kotPrefix: 'KOT',
        invoicePrefix: 'INV',
        footerText: 'Thank you for dining with Urban Hearth Bistro! Please visit again.',
        createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      },
    ],
    applications: [],
    menuItems: getDefaultMenuItems(),
    sessions: getDefaultSessions(),
    orders: getDefaultOrders(),
    coupons: getDefaultCoupons()
  };
};

// Load store from disk or seed
const loadStore = () => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf8');
      const parsed = JSON.parse(content);
      let changed = false;

      if (!parsed.menuItems || parsed.menuItems.length === 0) {
        parsed.menuItems = getDefaultMenuItems();
        changed = true;
      }
      if (!parsed.sessions || parsed.sessions.length === 0) {
        parsed.sessions = getDefaultSessions();
        changed = true;
      }
      if (!parsed.orders || parsed.orders.length === 0) {
        parsed.orders = getDefaultOrders();
        changed = true;
      }
      if (!parsed.coupons || parsed.coupons.length === 0) {
        parsed.coupons = getDefaultCoupons();
        changed = true;
      }

      // Ensure cafes have tax/billing and onboarding fields
      if (parsed.cafes) {
        parsed.cafes.forEach(c => {
          if (c.taxPercent === undefined) { c.taxPercent = 5; changed = true; }
          if (!c.taxLabel) { c.taxLabel = 'GST'; changed = true; }
          if (!c.kotPrefix) { c.kotPrefix = 'KOT'; changed = true; }
          if (!c.invoicePrefix) { c.invoicePrefix = 'INV'; changed = true; }
          if (!c.onboarding) {
            c.onboarding = {
              onboarding_started: false,
              onboarding_completed: false,
              onboarding_skipped: false,
              current_setup_step: 0,
              completed_setup_steps: [],
              skipped_setup_steps: [],
              current_tour_module: 'overview',
              current_tour_step: 0,
              completed_tour_modules: [],
              skipped_tour_modules: [],
              tour_completed: false,
              welcome_banner_seen: false,
              welcome_banner_dismissed_at: null
            };
            changed = true;
          }
        });
      }

      if (changed) {
        saveStore(parsed);
      }
      return parsed;
    }
  } catch (err) {
    console.error('Error reading offline storage file, reinitializing:', err.message);
  }
  const initial = getInitialData();
  saveStore(initial);
  return initial;
};

// Save store to disk
const saveStore = (data) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving offline storage file:', err.message);
  }
};

let store = loadStore();

// ========================
// Users
// ========================
const findUser = (predicate) => {
  store = loadStore();
  return store.users.find(predicate);
};

const verifySuperAdmin = async (email, password) => {
  store = loadStore();
  const normalizedEmail = (email || '').toLowerCase().trim();
  const user = store.users.find(
    (u) => u.email.toLowerCase() === normalizedEmail && u.role === 'superadmin'
  );
  if (!user) return null;

  if (user.plainPassword && user.plainPassword === password) {
    return user;
  }
  const isMatch = await bcrypt.compare(password, user.password);
  return isMatch ? user : null;
};

// ========================
// Cafes
// ========================
const getCafes = () => {
  store = loadStore();
  return [...store.cafes].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

const findCafe = (predicateOrId) => {
  store = loadStore();
  if (typeof predicateOrId === 'function') {
    return store.cafes.find(predicateOrId);
  }
  if (!predicateOrId) return null;
  const idStr = String(predicateOrId);
  return store.cafes.find(
    (c) =>
      c._id === idStr ||
      c.cafeId === idStr ||
      (c.slug && c.slug.toLowerCase() === idStr.toLowerCase())
  );
};

const createCafe = (cafeData) => {
  store = loadStore();
  const newCafe = {
    _id: `offline-cafe-${Date.now()}`,
    taxPercent: 5,
    taxLabel: 'GST',
    kotPrefix: 'KOT',
    invoicePrefix: 'INV',
    ...cafeData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.cafes.unshift(newCafe);
  saveStore(store);
  return newCafe;
};

const updateCafe = (id, updates) => {
  store = loadStore();
  const idx = store.cafes.findIndex((c) => c._id === id || c.cafeId === id);
  if (idx === -1) return null;

  const existing = store.cafes[idx];
  const mergedOnboarding = updates.onboarding
    ? { ...(existing.onboarding || {}), ...updates.onboarding }
    : existing.onboarding;

  const mergedSocial = updates.socialLinks
    ? { ...(existing.socialLinks || {}), ...updates.socialLinks }
    : existing.socialLinks;

  store.cafes[idx] = {
    ...existing,
    ...updates,
    ...(mergedSocial ? { socialLinks: mergedSocial } : {}),
    ...(mergedOnboarding ? { onboarding: mergedOnboarding } : {}),
    updatedAt: new Date().toISOString(),
  };
  saveStore(store);
  return store.cafes[idx];
};

const deleteCafe = (id) => {
  store = loadStore();
  const prevLen = store.cafes.length;
  store.cafes = store.cafes.filter((c) => c._id !== id && c.cafeId !== id);
  if (store.cafes.length < prevLen) {
    saveStore(store);
    return true;
  }
  return false;
};

// ========================
// Applications
// ========================
const getApplications = (filter = {}) => {
  store = loadStore();
  let list = [...store.applications];

  if (filter.status && filter.status !== 'All') {
    list = list.filter((a) => (a.status || '').toLowerCase() === filter.status.toLowerCase());
  }

  if (filter.search) {
    const q = filter.search.toLowerCase();
    list = list.filter(
      (a) =>
        (a.restaurantName && a.restaurantName.toLowerCase().includes(q)) ||
        (a.ownerName && a.ownerName.toLowerCase().includes(q)) ||
        (a.city && a.city.toLowerCase().includes(q)) ||
        (a.phone && a.phone.toLowerCase().includes(q)) ||
        (a.email && a.email.toLowerCase().includes(q)) ||
        (a.applicationId && a.applicationId.toLowerCase().includes(q))
    );
  }

  return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

const findApplication = (predicate) => {
  store = loadStore();
  return store.applications.find(predicate);
};

const createApplication = (appData) => {
  store = loadStore();
  const newApp = {
    _id: `offline-app-${Date.now()}`,
    ...appData,
    status: appData.status || 'New',
    adminNotes: appData.adminNotes || '',
    convertedCafeId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.applications.unshift(newApp);
  saveStore(store);
  return newApp;
};

const updateApplication = (id, updates) => {
  store = loadStore();
  const idx = store.applications.findIndex(
    (a) => a._id === id || a.applicationId === id
  );
  if (idx === -1) return null;
  store.applications[idx] = {
    ...store.applications[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveStore(store);
  return store.applications[idx];
};

const deleteApplication = (id) => {
  store = loadStore();
  const prevLen = store.applications.length;
  store.applications = store.applications.filter(
    (a) => a._id !== id && a.applicationId !== id
  );
  if (store.applications.length < prevLen) {
    saveStore(store);
    return true;
  }
  return false;
};

// ========================
// Menu Items
// ========================
const getMenuItems = (cafeId) => {
  store = loadStore();
  return (store.menuItems || [])
    .filter((m) => m.cafe === cafeId || !cafeId)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || a.name.localeCompare(b.name));
};

const findMenuItem = (predicate) => {
  store = loadStore();
  return (store.menuItems || []).find(predicate);
};

const createMenuItem = (itemData) => {
  store = loadStore();
  store.menuItems = store.menuItems || [];
  const newItem = {
    _id: `item-${Date.now()}`,
    isVeg: true,
    isAvailable: true,
    preparationTime: 15,
    sortOrder: store.menuItems.length + 1,
    ...itemData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  store.menuItems.push(newItem);
  saveStore(store);
  return newItem;
};

const updateMenuItem = (id, updates) => {
  store = loadStore();
  store.menuItems = store.menuItems || [];
  const idx = store.menuItems.findIndex((m) => m._id === id);
  if (idx === -1) return null;
  store.menuItems[idx] = {
    ...store.menuItems[idx],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  saveStore(store);
  return store.menuItems[idx];
};

const deleteMenuItem = (id) => {
  store = loadStore();
  store.menuItems = store.menuItems || [];
  const prevLen = store.menuItems.length;
  store.menuItems = store.menuItems.filter((m) => m._id !== id);
  if (store.menuItems.length < prevLen) {
    saveStore(store);
    return true;
  }
  return false;
};

const toggleMenuItemAvailability = (id) => {
  store = loadStore();
  store.menuItems = store.menuItems || [];
  const item = store.menuItems.find((m) => m._id === id);
  if (!item) return null;
  item.isAvailable = !item.isAvailable;
  item.updatedAt = new Date().toISOString();
  saveStore(store);
  return item;
};

// ========================
// Orders
// ========================
const getOrders = (cafeId, filter = {}) => {
  store = loadStore();
  let list = (store.orders || []).filter((o) => o.cafe === cafeId || !cafeId);

  if (filter.status && filter.status !== 'All') {
    list = list.filter((o) => (o.status || '').toLowerCase() === filter.status.toLowerCase());
  }
  if (filter.source && filter.source !== 'All') {
    list = list.filter((o) => (o.orderSource || '').toLowerCase() === filter.source.toLowerCase());
  }
  if (filter.type && filter.type !== 'All') {
    list = list.filter((o) => (o.orderType || '').toLowerCase() === filter.type.toLowerCase());
  }
  if (filter.tableNumber) {
    list = list.filter((o) => String(o.tableNumber) === String(filter.tableNumber));
  }

  return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

const getOrderById = (id, cafeId) => {
  store = loadStore();
  return (store.orders || []).find((o) => o._id === id && (!cafeId || o.cafe === cafeId));
};

const createOrder = (orderData) => {
  store = loadStore();
  store.orders = store.orders || [];

  const kotSeq = store.orders.length + 101;
  const kotNumber = orderData.kotNumber || `KOT-${kotSeq}`;

  const newOrder = {
    _id: `ord-${Date.now()}`,
    orderSource: 'Counter POS',
    orderType: 'Dine-In',
    status: 'Pending',
    paymentStatus: 'Unpaid',
    paymentMethod: 'Cash',
    kotNumber,
    kotPrintedAt: new Date().toISOString(),
    ...orderData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  store.orders.unshift(newOrder);

  // If order belongs to a session, update session totals and orders list
  if (newOrder.sessionId) {
    const session = (store.sessions || []).find((s) => s._id === newOrder.sessionId);
    if (session) {
      session.orders = session.orders || [];
      if (!session.orders.includes(newOrder._id)) {
        session.orders.push(newOrder._id);
      }
      session.subtotal = (session.subtotal || 0) + (newOrder.subtotal || newOrder.itemTotal || 0);
      session.taxAmount = (session.taxAmount || 0) + (newOrder.taxAmount || 0);
      session.grandTotal = (session.grandTotal || 0) + (newOrder.grandTotal || 0);
      session.updatedAt = new Date().toISOString();
    }
  }

  saveStore(store);
  return newOrder;
};

const updateOrderStatus = (id, status, extra = {}) => {
  store = loadStore();
  store.orders = store.orders || [];
  const idx = store.orders.findIndex((o) => o._id === id);
  if (idx === -1) return null;
  store.orders[idx] = {
    ...store.orders[idx],
    status: status || store.orders[idx].status,
    ...extra,
    updatedAt: new Date().toISOString()
  };
  saveStore(store);
  return store.orders[idx];
};

// ========================
// Sessions
// ========================
const getActiveSessions = (cafeId) => {
  store = loadStore();
  const now = Date.now();
  let modified = false;

  (store.sessions || []).forEach(s => {
    const sessionOrders = (store.orders || []).filter(o => (s.orders || []).includes(o._id) || o.sessionId === s._id);
    const validOrders = sessionOrders.filter(o => (o.status || '').toLowerCase() !== 'cancelled');
    const allPaid = validOrders.length > 0 && validOrders.every(o => (o.paymentStatus || '').toLowerCase() === 'paid');
    const isSettled = s.status === 'settled' || (s.paymentStatus || '').toLowerCase() === 'paid' || allPaid;

    if (isSettled && s.status !== 'closed') {
      if (!s.settledAt) {
        s.settledAt = new Date().toISOString();
        s.autoFreeAt = new Date(now + 60000).toISOString();
        s.status = 'settled';
        modified = true;
      }
      const elapsed = Math.floor((now - new Date(s.settledAt).getTime()) / 1000);
      if (elapsed >= 60) {
        s.status = 'closed';
        s.closedAt = new Date().toISOString();
        modified = true;
      }
    }
  });

  if (modified) saveStore(store);

  const sessions = (store.sessions || [])
    .filter((s) => (s.cafe === cafeId || !cafeId) && (s.status === 'active' || s.status === 'billing' || s.status === 'settled'))
    .sort((a, b) => a.tableNumber - b.tableNumber);

  // Populate orders
  return sessions.map(s => {
    const sessionOrders = (store.orders || []).filter(o => (s.orders || []).includes(o._id) || o.sessionId === s._id);
    return {
      ...s,
      orders: sessionOrders
    };
  });
};

const getSessionById = (id, cafeId) => {
  store = loadStore();
  const s = (store.sessions || []).find((sess) => (sess._id === id || sess.sessionCode === id) && (!cafeId || sess.cafe === cafeId));
  if (!s) return null;
  const sessionOrders = (store.orders || []).filter(o => ((s.orders || []).includes(o._id) || o.sessionId === s._id) && (!cafeId || o.cafe === cafeId));
  return {
    ...s,
    orders: sessionOrders
  };
};

const openSession = (data) => {
  store = loadStore();
  store.sessions = store.sessions || [];

  // Check if active session already exists for this table
  const existing = store.sessions.find(
    (s) => s.cafe === data.cafe && s.tableNumber === Number(data.tableNumber) && (s.status === 'active' || s.status === 'billing')
  );
  if (existing) {
    const err = new Error(`Table ${data.tableNumber} already has an active dining session`);
    err.status = 400;
    throw err;
  }

  const randSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const sessionCode = `SES-T${data.tableNumber}-${randSuffix}`;

  const newSession = {
    _id: `sess-${Date.now()}`,
    cafe: data.cafe,
    tableNumber: Number(data.tableNumber),
    sessionCode,
    guestName: data.guestName || `Table ${data.tableNumber} Guest`,
    guestPhone: data.guestPhone || '',
    pax: Number(data.pax) || 2,
    status: 'active',
    openedAt: new Date().toISOString(),
    orders: [],
    subtotal: 0,
    taxAmount: 0,
    discountAmount: 0,
    grandTotal: 0,
    paymentStatus: 'Unpaid',
    notes: data.notes || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  store.sessions.push(newSession);
  saveStore(store);
  return newSession;
};

const updateSession = (id, updates, cafeId) => {
  store = loadStore();
  store.sessions = store.sessions || [];
  const idx = store.sessions.findIndex((s) => s._id === id && (!cafeId || s.cafe === cafeId));
  if (idx === -1) return null;
  store.sessions[idx] = {
    ...store.sessions[idx],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  saveStore(store);
  return store.sessions[idx];
};

const closeSession = (id, billingData = {}, cafeId) => {
  store = loadStore();
  store.sessions = store.sessions || [];
  const idx = store.sessions.findIndex((s) => s._id === id && (!cafeId || s.cafe === cafeId));
  if (idx === -1) return null;

  const session = store.sessions[idx];
  const invoiceSeq = store.orders.filter(o => o.invoiceNumber).length + 101;
  const invoiceNumber = billingData.invoiceNumber || `INV-${invoiceSeq}`;

  store.sessions[idx] = {
    ...session,
    status: 'closed',
    paymentStatus: 'Paid',
    paymentMethod: billingData.paymentMethod || 'Cash',
    discountAmount: billingData.discountAmount !== undefined ? billingData.discountAmount : session.discountAmount,
    grandTotal: billingData.grandTotal !== undefined ? billingData.grandTotal : session.grandTotal,
    closedAt: new Date().toISOString(),
    invoiceNumber,
    invoicePrintedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Mark all orders in this session as Paid & Served
  (store.orders || []).forEach(o => {
    if (((session.orders || []).includes(o._id) || o.sessionId === session._id) && (!cafeId || o.cafe === cafeId)) {
      o.paymentStatus = 'Paid';
      o.paymentMethod = billingData.paymentMethod || 'Cash';
      o.status = 'Served';
      o.invoiceNumber = invoiceNumber;
      o.completedAt = new Date().toISOString();
    }
  });

  saveStore(store);
  return store.sessions[idx];
};

const cancelSession = (id, cafeId) => {
  store = loadStore();
  store.sessions = store.sessions || [];
  const idx = store.sessions.findIndex((s) => s._id === id && (!cafeId || s.cafe === cafeId));
  if (idx === -1) return null;
  store.sessions.splice(idx, 1);
  saveStore(store);
  return true;
};

// ========================
// Coupons
// ========================
const getCoupons = (cafeId) => {
  store = loadStore();
  return (store.coupons || [])
    .filter((c) => c.cafe === cafeId || !cafeId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

const createCoupon = (couponData) => {
  store = loadStore();
  store.coupons = store.coupons || [];
  const newCoupon = {
    _id: `cpn-${Date.now()}`,
    usedCount: 0,
    isActive: true,
    ...couponData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  store.coupons.push(newCoupon);
  saveStore(store);
  return newCoupon;
};

const updateCoupon = (id, updates) => {
  store = loadStore();
  store.coupons = store.coupons || [];
  const idx = store.coupons.findIndex((c) => c._id === id);
  if (idx === -1) return null;
  store.coupons[idx] = {
    ...store.coupons[idx],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  saveStore(store);
  return store.coupons[idx];
};

const deleteCoupon = (id) => {
  store = loadStore();
  store.coupons = store.coupons || [];
  const prevLen = store.coupons.length;
  store.coupons = store.coupons.filter((c) => c._id !== id);
  if (store.coupons.length < prevLen) {
    saveStore(store);
    return true;
  }
  return false;
};

// ========================
// Phase 2: Reservations
// ========================
const getReservations = (cafeId, { date, status } = {}) => {
  store = loadStore();
  let list = (store.reservations || []).filter(r => r.cafe === cafeId || !cafeId);
  if (status && status !== 'all') list = list.filter(r => r.status === status);
  if (date) {
    const dStr = new Date(date).toISOString().slice(0, 10);
    list = list.filter(r => (r.reservationDate || '').startsWith(dStr));
  }
  return list.sort((a, b) => (a.timeSlot || '').localeCompare(b.timeSlot || ''));
};

const createReservation = (data) => {
  store = loadStore();
  store.reservations = store.reservations || [];
  const res = {
    _id: `res-${Date.now()}`,
    status: 'confirmed',
    ...data,
    createdAt: new Date().toISOString()
  };
  store.reservations.push(res);
  saveStore(store);
  return res;
};

const updateReservation = (id, updates, cafeId) => {
  store = loadStore();
  store.reservations = store.reservations || [];
  const idx = store.reservations.findIndex(r => r._id === id && (!cafeId || r.cafe === cafeId));
  if (idx === -1) return null;
  store.reservations[idx] = { ...store.reservations[idx], ...updates, updatedAt: new Date().toISOString() };
  saveStore(store);
  return store.reservations[idx];
};

const seatReservation = (id, tableNumber, cafeId) => {
  store = loadStore();
  store.reservations = store.reservations || [];
  const idx = store.reservations.findIndex(r => r._id === id && (!cafeId || r.cafe === cafeId));
  if (idx === -1) return { message: 'Reservation not found' };
  const res = store.reservations[idx];
  const tbl = tableNumber ? parseInt(tableNumber, 10) : (res.tableNumber ? parseInt(res.tableNumber, 10) : null);
  if (!tbl || isNaN(tbl) || tbl < 1) {
    return { error: true, message: 'A valid table number is required to seat this guest' };
  }

  let session = (store.sessions || []).find(s => s.cafe === res.cafe && s.tableNumber === tbl && (s.status === 'active' || s.status === 'billing'));
  if (!session) {
    session = openSession({
      cafe: res.cafe,
      tableNumber: tbl,
      guestName: res.customerName,
      guestPhone: res.customerPhone,
      pax: res.pax,
      notes: `Reservation ${res.timeSlot}`
    });
  }

  res.status = 'seated';
  res.tableNumber = tbl;
  res.sessionId = session._id;
  store.reservations[idx] = res;
  saveStore(store);
  return { message: `Guest seated at Table ${tbl}`, reservation: res, session };
};

const deleteReservation = (id, cafeId) => {
  store = loadStore();
  store.reservations = (store.reservations || []).filter(r => !(r._id === id && (!cafeId || r.cafe === cafeId)));
  saveStore(store);
  return true;
};

// ========================
// Phase 2: Staff & PIN Login
// ========================
const getStaff = (cafeId) => {
  store = loadStore();
  return (store.staff || [])
    .filter(s => s.cafe === cafeId || !cafeId)
    .map(({ pin, ...safe }) => safe);
};

const createStaff = (data) => {
  store = loadStore();
  store.staff = store.staff || [];
  const newStaff = {
    _id: `staff-${Date.now()}`,
    isActive: true,
    ...data,
    createdAt: new Date().toISOString()
  };
  store.staff.push(newStaff);
  saveStore(store);
  const { pin, ...safe } = newStaff;
  return safe;
};

const updateStaff = (id, updates, cafeId) => {
  store = loadStore();
  store.staff = store.staff || [];
  const idx = store.staff.findIndex(s => s._id === id && (!cafeId || s.cafe === cafeId));
  if (idx === -1) return null;
  store.staff[idx] = { ...store.staff[idx], ...updates, updatedAt: new Date().toISOString() };
  saveStore(store);
  const { pin, ...safe } = store.staff[idx];
  return safe;
};

const resetStaffPin = (id, newPin, cafeId) => {
  store = loadStore();
  store.staff = store.staff || [];
  const idx = store.staff.findIndex(s => s._id === id && (!cafeId || s.cafe === cafeId));
  if (idx === -1) return null;
  store.staff[idx].pin = newPin;
  saveStore(store);
  return true;
};

const toggleStaff = (id, cafeId) => {
  store = loadStore();
  store.staff = store.staff || [];
  const idx = store.staff.findIndex(s => s._id === id && (!cafeId || s.cafe === cafeId));
  if (idx === -1) return null;
  store.staff[idx].isActive = !store.staff[idx].isActive;
  saveStore(store);
  const { pin, ...safe } = store.staff[idx];
  return safe;
};

const deleteStaff = (id, cafeId) => {
  store = loadStore();
  store.staff = (store.staff || []).filter(s => !(s._id === id && (!cafeId || s.cafe === cafeId)));
  saveStore(store);
  return true;
};

const verifyStaffPin = (cafeId, pin) => {
  store = loadStore();
  return (store.staff || []).find(s => (s.cafe === cafeId || !cafeId) && s.isActive && String(s.pin) === String(pin));
};

// ========================
// Phase 2: Customer CRM
// ========================
const getCustomers = (cafeId, { search = '', tag = '', sort = 'spend' } = {}) => {
  store = loadStore();
  let list = (store.customers || []).filter(c => c.cafe === cafeId || !cafeId);
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(c => (c.name || '').toLowerCase().includes(q) || (c.phone || '').includes(q));
  }
  if (tag && tag !== 'all') {
    list = list.filter(c => (c.tags || []).includes(tag));
  }
  if (sort === 'orders') list.sort((a, b) => (b.totalOrders || 0) - (a.totalOrders || 0));
  else if (sort === 'recent') list.sort((a, b) => new Date(b.lastVisit || 0) - new Date(a.lastVisit || 0));
  else list.sort((a, b) => (b.totalSpend || 0) - (a.totalSpend || 0));
  return list;
};

const getCustomerById = (id, cafeId) => {
  store = loadStore();
  const customer = (store.customers || []).find(c => c._id === id && (!cafeId || c.cafe === cafeId));
  if (!customer) return null;
  const orders = (store.orders || []).filter(o => (o.customerPhone === customer.phone || o.customerName === customer.name) && (!cafeId || o.cafe === cafeId));
  return { customer, orders };
};

const updateCustomer = (id, updates, cafeId) => {
  store = loadStore();
  store.customers = store.customers || [];
  const idx = store.customers.findIndex(c => c._id === id && (!cafeId || c.cafe === cafeId));
  if (idx === -1) return null;
  store.customers[idx] = { ...store.customers[idx], ...updates, updatedAt: new Date().toISOString() };
  saveStore(store);
  return store.customers[idx];
};

const deleteCustomer = (id, cafeId) => {
  store = loadStore();
  store.customers = (store.customers || []).filter(c => !(c._id === id && (!cafeId || c.cafe === cafeId)));
  saveStore(store);
  return true;
};

const updateCustomerFromOrder = (cafeId, { customerName, customerPhone, items = [], totalAmount = 0 }) => {
  if (!customerPhone) return;
  store = loadStore();
  store.customers = store.customers || [];
  let cust = store.customers.find(c => (c.cafe === cafeId || !cafeId) && c.phone === customerPhone);
  const now = new Date().toISOString();
  if (!cust) {
    cust = {
      _id: `cust-${Date.now()}`,
      cafe: cafeId,
      name: customerName || 'Guest',
      phone: customerPhone,
      totalOrders: 1,
      totalSpend: totalAmount,
      avgOrderValue: totalAmount,
      firstVisit: now,
      lastVisit: now,
      favoriteItems: items.map(i => ({ name: i.name, count: i.quantity || 1 })),
      tags: []
    };
    store.customers.push(cust);
  } else {
    cust.totalOrders = (cust.totalOrders || 0) + 1;
    cust.totalSpend = (cust.totalSpend || 0) + totalAmount;
    cust.avgOrderValue = Math.round(cust.totalSpend / cust.totalOrders);
    cust.lastVisit = now;
    if (customerName && customerName !== 'Guest') cust.name = customerName;
  }
  saveStore(store);
};

// ========================
// Phase 2: Inventory
// ========================
const getInventory = (cafeId, { status, category } = {}) => {
  store = loadStore();
  let items = (store.menuItems || []).filter(i => i.cafe === cafeId || !cafeId);
  if (category && category !== 'all') items = items.filter(i => i.category === category);
  if (status === 'low') items = items.filter(i => i.trackStock && i.stockQuantity <= (i.lowStockThreshold || 5) && i.stockQuantity > 0 && !i.isOutOfStock);
  else if (status === 'out') items = items.filter(i => i.isOutOfStock || (i.trackStock && i.stockQuantity <= 0) || !i.isAvailable);
  else if (status === 'tracked') items = items.filter(i => i.trackStock);

  const allItems = (store.menuItems || []).filter(i => i.cafe === cafeId || !cafeId);
  return {
    summary: {
      totalItems: allItems.length,
      trackedCount: allItems.filter(i => i.trackStock).length,
      lowStockCount: allItems.filter(i => i.trackStock && i.stockQuantity <= (i.lowStockThreshold || 5) && i.stockQuantity > 0).length,
      outOfStockCount: allItems.filter(i => i.isOutOfStock || (i.trackStock && i.stockQuantity <= 0) || !i.isAvailable).length
    },
    items
  };
};

const updateItemStock = (itemId, updates, cafeId) => {
  store = loadStore();
  store.menuItems = store.menuItems || [];
  const idx = store.menuItems.findIndex(i => i._id === itemId && (!cafeId || i.cafe === cafeId));
  if (idx === -1) return null;
  const item = store.menuItems[idx];
  if (updates.trackStock !== undefined) item.trackStock = Boolean(updates.trackStock);
  if (updates.lowStockThreshold !== undefined) item.lowStockThreshold = Number(updates.lowStockThreshold);
  if (updates.delta !== undefined) item.stockQuantity = Math.max(0, (item.stockQuantity || 0) + Number(updates.delta));
  else if (updates.stockQuantity !== undefined) item.stockQuantity = Math.max(0, Number(updates.stockQuantity));

  if (item.trackStock) {
    item.isOutOfStock = item.stockQuantity <= 0;
    item.isAvailable = item.stockQuantity > 0;
  }
  store.menuItems[idx] = item;
  saveStore(store);
  return item;
};

const toggle86 = (itemId, cafeId) => {
  store = loadStore();
  store.menuItems = store.menuItems || [];
  const idx = store.menuItems.findIndex(i => i._id === itemId && (!cafeId || i.cafe === cafeId));
  if (idx === -1) return null;
  const item = store.menuItems[idx];
  item.isOutOfStock = !item.isOutOfStock;
  item.isAvailable = !item.isOutOfStock;
  store.menuItems[idx] = item;
  saveStore(store);
  return item;
};

const decrementStock = (cafeId, items) => {
  store = loadStore();
  store.menuItems = store.menuItems || [];
  (items || []).forEach(it => {
    const item = store.menuItems.find(m => (m.cafe === cafeId || !cafeId) && (m._id === it.menuItemId || m.name === it.name));
    if (item && item.trackStock) {
      item.stockQuantity = Math.max(0, (item.stockQuantity || 0) - (it.quantity || 1));
      if (item.stockQuantity <= 0) {
        item.isOutOfStock = true;
        item.isAvailable = false;
      }
    }
  });
};

// ========================
// Support Tickets (Phase 3 & Support Workflow)
// ========================
const getTickets = (cafeId) => {
  store = loadStore();
  store.tickets = store.tickets || [];
  if (!cafeId) return store.tickets;
  return store.tickets.filter((t) => String(t.cafe) === String(cafeId));
};

const findTicketById = (id, cafeId = null) => {
  store = loadStore();
  store.tickets = store.tickets || [];
  return store.tickets.find((t) => (t._id === id || t.ticketId === id) && (!cafeId || String(t.cafe) === String(cafeId)));
};

const createTicket = (ticketData) => {
  store = loadStore();
  store.tickets = store.tickets || [];
  const now = new Date();
  const dateStr = now.toISOString().slice(2, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  const ticketId = `TCK-${dateStr}-${rand}`;

  const newTicket = {
    _id: `tck-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    ticketId,
    status: 'Open',
    priority: 'Medium',
    conversation: [],
    auditLog: [
      {
        action: 'Ticket Created',
        performedBy: {
          id: ticketData.createdBy || '',
          name: ticketData.creatorName || 'Staff',
          role: ticketData.creatorRole || 'cafeowner'
        },
        details: `Ticket ${ticketId} created under category ${ticketData.category}`,
        timestamp: now.toISOString()
      }
    ],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    ...ticketData
  };

  store.tickets.unshift(newTicket);
  saveStore(store);
  return newTicket;
};

const updateTicket = (id, updateData) => {
  store = loadStore();
  store.tickets = store.tickets || [];
  const idx = store.tickets.findIndex((t) => t._id === id || t.ticketId === id);
  if (idx === -1) return null;
  store.tickets[idx] = {
    ...store.tickets[idx],
    ...updateData,
    updatedAt: new Date().toISOString()
  };
  saveStore(store);
  return store.tickets[idx];
};

const addTicketMessage = (id, messageData) => {
  store = loadStore();
  store.tickets = store.tickets || [];
  const idx = store.tickets.findIndex((t) => t._id === id || t.ticketId === id);
  if (idx === -1) return null;
  store.tickets[idx].conversation = store.tickets[idx].conversation || [];
  store.tickets[idx].conversation.push({
    ...messageData,
    timestamp: new Date().toISOString()
  });
  store.tickets[idx].updatedAt = new Date().toISOString();
  saveStore(store);
  return store.tickets[idx];
};

const addTicketAudit = (id, auditData) => {
  store = loadStore();
  store.tickets = store.tickets || [];
  const idx = store.tickets.findIndex((t) => t._id === id || t.ticketId === id);
  if (idx === -1) return null;
  store.tickets[idx].auditLog = store.tickets[idx].auditLog || [];
  store.tickets[idx].auditLog.push({
    ...auditData,
    timestamp: new Date().toISOString()
  });
  saveStore(store);
  return store.tickets[idx];
};

module.exports = {
  findUser,
  verifySuperAdmin,
  getCafes,
  findCafe,
  createCafe,
  updateCafe,
  deleteCafe,
  getApplications,
  findApplication,
  createApplication,
  updateApplication,
  deleteApplication,
  getMenuItems,
  findMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleMenuItemAvailability,
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  getActiveSessions,
  getSessionById,
  openSession,
  updateSession,
  closeSession,
  cancelSession,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  // Phase 2 exports
  getReservations,
  createReservation,
  updateReservation,
  seatReservation,
  deleteReservation,
  getStaff,
  createStaff,
  updateStaff,
  resetStaffPin,
  toggleStaff,
  deleteStaff,
  verifyStaffPin,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  updateCustomerFromOrder,
  getInventory,
  updateItemStock,
  toggle86,
  decrementStock,
  // Support Tickets
  getTickets,
  findTicketById,
  createTicket,
  updateTicket,
  addTicketMessage,
  addTicketAudit
};
