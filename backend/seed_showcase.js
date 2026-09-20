const mongoose = require('mongoose');
require('dotenv').config();
const Cafe = require('./models/Cafe');
const MenuItem = require('./models/MenuItem');
const Coupon = require('./models/Coupon');
const offlineStore = require('./utils/offlineStore');

async function seedMultiTenantCafes() {
  console.log('Seeding Multi-Tenant Showcase Cafes...');

  // 1. The Garden Cafe
  const gardenData = {
    cafeId: 'GARDEN01',
    slug: 'the-garden-cafe',
    name: 'The Garden Café',
    ownerName: 'Aarav Singhania',
    tagline: 'GOOD FOOD • GOOD MOOD',
    phone: '+91 98290 12345',
    email: 'hello@thegardencafe.com',
    address: '14, Palm Grove Lane, Civil Lines',
    city: 'Jaipur',
    cuisine: ['Italian', 'Artisan Bakery', 'Specialty Coffee', 'Desserts'],
    openTime: '08:30',
    closeTime: '23:00',
    tableCount: 20,
    taxPercent: 5,
    taxLabel: 'GST',
    currency: '₹',
    theme: 'classic-dark',
    branding: {
      primaryColor: '#173D32',
      secondaryColor: '#53685C',
      accentColor: '#D7B56D',
      backgroundColor: '#F7F4EC',
      surfaceColor: '#FFFFFF',
      textColor: '#18211D',
      mutedColor: '#6F7772',
      borderColor: 'rgba(23,61,50,0.10)',
      fontFamily: 'Playfair Display'
    },
    orderingConfig: {
      qrOrderingEnabled: true,
      customerNameRequired: true,
      customerPhoneRequired: true,
      allowRepeatOrders: true,
      allowCustomerNotes: true,
      allowOnlinePayment: false,
      allowCashPayment: true,
      allowUpi: true
    },
    socialLinks: {
      instagram: 'https://instagram.com/thegardencafe',
      website: 'https://thegardencafe.com',
      mapsUrl: 'https://maps.google.com'
    },
    isActive: true
  };

  // 2. Urban Hearth Bistro
  const urbanData = {
    cafeId: 'URBAN01',
    slug: 'urban-hearth-bistro',
    name: 'Urban Hearth Bistro',
    ownerName: 'Kabir Mehta',
    tagline: 'RUSTIC FLAVORS • CONTEMPORARY VIBE',
    phone: '+91 98110 56789',
    email: 'dine@urbanhearth.com',
    address: '88, Metropolitan Plaza, M.G. Road',
    city: 'Bengaluru',
    cuisine: ['Gourmet Burgers', 'Grill & Smoke', 'Craft Beverages'],
    openTime: '11:00',
    closeTime: '23:30',
    tableCount: 15,
    taxPercent: 5,
    taxLabel: 'GST',
    currency: '₹',
    theme: 'crimson-velvet',
    branding: {
      primaryColor: '#993D2A',
      secondaryColor: '#6E473B',
      accentColor: '#D97706',
      backgroundColor: '#FAF7F2',
      surfaceColor: '#FFFFFF',
      textColor: '#261C18',
      mutedColor: '#7A6B65',
      borderColor: 'rgba(153,61,42,0.12)',
      fontFamily: 'Playfair Display'
    },
    orderingConfig: {
      qrOrderingEnabled: true,
      customerNameRequired: true,
      customerPhoneRequired: true,
      allowRepeatOrders: true,
      allowCustomerNotes: true,
      allowOnlinePayment: false,
      allowCashPayment: true,
      allowUpi: true
    },
    socialLinks: {
      instagram: 'https://instagram.com/urbanhearthbistro',
      website: 'https://urbanhearthbistro.com',
      mapsUrl: 'https://maps.google.com'
    },
    isActive: true
  };

  const gardenMenu = [
    { name: 'Woodfired Margherita Pizza', category: 'Pizza', price: 420, isVeg: true, badge: 'Bestseller', description: 'San Marzano tomato sauce, fresh buffalo mozzarella, fragrant basil leaves and cold pressed olive oil on sourdough crust.', image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&auto=format&fit=crop&q=80', preparationTime: 18, sortOrder: 1 },
    { name: 'Truffle Mushroom Fettuccine', category: 'Pasta', price: 460, isVeg: true, badge: "Chef's Pick", description: 'Silky egg ribbon pasta tossed with wild forest mushrooms, white truffle butter, fresh parsley and shaved parmesan.', image: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=600&auto=format&fit=crop&q=80', preparationTime: 15, sortOrder: 2 },
    { name: 'Cold Brew Float with Gelato', category: 'Drinks', price: 240, isVeg: true, badge: 'Bestseller', description: '16-hour slow steep Arabica cold brew poured over artisan Madagascan vanilla bean gelato.', image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80', preparationTime: 5, sortOrder: 3 },
    { name: 'Avocado Tartine with Herb Ricotta', category: 'Salad', price: 320, isVeg: true, badge: 'Must Try', description: 'Hass avocado slices on toasted artisan sourdough with whipped herb ricotta, microgreens and roasted seeds.', image: 'https://images.unsplash.com/photo-1588137378633-dea1336ce1e2?w=600&auto=format&fit=crop&q=80', preparationTime: 10, sortOrder: 4 },
    { name: 'Rose & Pistachio Tiramisu', category: 'Desserts', price: 290, isVeg: true, badge: "Chef's Pick", description: 'Mascarpone cream infused with wild rose extract and crushed roasted pistachios over espresso-soaked ladyfingers.', image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&auto=format&fit=crop&q=80', preparationTime: 5, sortOrder: 5 },
    { name: 'Smoked Gouda Paneer Panini', category: 'Burger', price: 340, isVeg: true, badge: 'Popular', description: 'Charcoal grilled cottage cheese, caramelized onions, smoked gouda and sun-dried tomato pesto pressed in ciabatta.', image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80', preparationTime: 12, sortOrder: 6 },
    { name: 'Passion Fruit Mint Sparkler', category: 'Drinks', price: 210, isVeg: true, badge: 'New', description: 'Sparkling mineral water infused with fresh passion fruit reduction, bruised garden mint and crushed ice.', image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80', preparationTime: 5, sortOrder: 7 },
    { name: 'Belgian Dark Chocolate Fondant', category: 'Desserts', price: 310, isVeg: true, badge: 'Popular', description: '70% Valrhona dark chocolate lava cake with warm molten center, accompanied by house berry coulis.', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop&q=80', preparationTime: 14, sortOrder: 8 }
  ];

  const gardenCoupons = [
    { code: 'GARDEN15', type: 'percentage', value: 15, title: '15% OFF — All Drinks', description: 'Valid on cold brews, signature lattes & iced teas', minOrder: 250, maxDiscount: 100, isActive: true },
    { code: 'COMBO20', type: 'percentage', value: 20, title: '20% OFF — Combo Meals', description: 'Get 20% off when ordering Pizza + Beverage combos', minOrder: 500, maxDiscount: 150, isActive: true },
    { code: 'SWEET10', type: 'flat', value: 50, title: '₹50 OFF — Desserts', description: 'Treat yourself to our artisan tiramisu & fondants', minOrder: 200, maxDiscount: 50, isActive: true }
  ];

  const urbanMenu = [
    { name: 'Smoked Chipotle Brioche Burger', category: 'Burger', price: 390, isVeg: false, badge: 'Bestseller', description: 'Flame grilled double smash patty, chipotle aioli, aged cheddar and house pickles in toasted butter brioche.', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80', preparationTime: 16, sortOrder: 1 },
    { name: 'Hand-Cut Truffle Parmesan Fries', category: 'Salad', price: 260, isVeg: true, badge: 'Popular', description: 'Double fried Idaho potatoes drizzled with black truffle oil and 24-month aged parmesan shavings.', image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&auto=format&fit=crop&q=80', preparationTime: 8, sortOrder: 2 },
    { name: 'Honey Sriracha Glazed Wings', category: 'Burger', price: 360, isVeg: false, badge: "Chef's Pick", description: 'Crispy chicken wings tossed in fiery red sriracha and organic clover honey, served with blue cheese dip.', image: 'https://images.unsplash.com/photo-1527477378408-1bc097a87140?w=600&auto=format&fit=crop&q=80', preparationTime: 15, sortOrder: 3 },
    { name: 'Smoked Citrus Cold Brew', category: 'Drinks', price: 220, isVeg: true, badge: 'New', description: 'Nitro cold brew infused with char-grilled Valencia orange peel and cinnamon smoke.', image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80', preparationTime: 4, sortOrder: 4 }
  ];

  const urbanCoupons = [
    { code: 'URBAN20', type: 'percentage', value: 20, title: '20% OFF — First Order', description: 'Welcome offer on orders above ₹400', minOrder: 400, maxDiscount: 150, isActive: true },
    { code: 'FLAT100', type: 'flat', value: 100, title: '₹100 OFF — Party Combos', description: 'Save ₹100 on big orders', minOrder: 750, maxDiscount: 100, isActive: true }
  ];

  // Save to offlineStore first
  try {
    let gCafe = offlineStore.findCafe(c => c.cafeId === 'GARDEN01' || c.slug === 'the-garden-cafe');
    if (!gCafe) {
      gCafe = offlineStore.createCafe(gardenData);
    } else {
      offlineStore.updateCafe(gCafe._id, gardenData);
    }

    let uCafe = offlineStore.findCafe(c => c.cafeId === 'URBAN01' || c.slug === 'urban-hearth-bistro');
    if (!uCafe) {
      uCafe = offlineStore.createCafe(urbanData);
    } else {
      offlineStore.updateCafe(uCafe._id, urbanData);
    }

    // Add menu items to offline store
    for (const item of gardenMenu) {
      const exists = (offlineStore.getMenuItems(gCafe._id) || []).find(m => m.name === item.name);
      if (!exists) {
        offlineStore.createMenuItem({ ...item, cafe: gCafe._id });
      }
    }

    for (const item of urbanMenu) {
      const exists = (offlineStore.getMenuItems(uCafe._id) || []).find(m => m.name === item.name);
      if (!exists) {
        offlineStore.createMenuItem({ ...item, cafe: uCafe._id });
      }
    }
    console.log('✅ Offline store updated with Garden Cafe and Urban Hearth Bistro!');
  } catch (err) {
    console.warn('Offline store update warning:', err.message);
  }

  // Save to MongoDB Atlas if reachable
  if (process.env.MONGODB_URI) {
    try {
      if (mongoose.connection.readyState !== 1) {
        await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 4000 });
      }

      // Upsert The Garden Cafe
      const gDoc = await Cafe.findOneAndUpdate(
        { $or: [{ cafeId: 'GARDEN01' }, { slug: 'the-garden-cafe' }] },
        gardenData,
        { upsert: true, new: true }
      );

      // Upsert Urban Hearth Bistro
      const uDoc = await Cafe.findOneAndUpdate(
        { $or: [{ cafeId: 'URBAN01' }, { slug: 'urban-hearth-bistro' }] },
        urbanData,
        { upsert: true, new: true }
      );

      // Upsert Garden Menu Items
      for (const item of gardenMenu) {
        await MenuItem.findOneAndUpdate(
          { cafe: gDoc._id, name: item.name },
          { ...item, cafe: gDoc._id },
          { upsert: true, new: true }
        );
      }

      // Upsert Garden Coupons
      for (const cpn of gardenCoupons) {
        await Coupon.findOneAndUpdate(
          { cafe: gDoc._id, code: cpn.code },
          { ...cpn, cafe: gDoc._id },
          { upsert: true, new: true }
        );
      }

      // Upsert Urban Menu Items
      for (const item of urbanMenu) {
        await MenuItem.findOneAndUpdate(
          { cafe: uDoc._id, name: item.name },
          { ...item, cafe: uDoc._id },
          { upsert: true, new: true }
        );
      }

      // Upsert Urban Coupons
      for (const cpn of urbanCoupons) {
        await Coupon.findOneAndUpdate(
          { cafe: uDoc._id, code: cpn.code },
          { ...cpn, cafe: uDoc._id },
          { upsert: true, new: true }
        );
      }

      console.log('✅ MongoDB Atlas seeded successfully with both showcase cafes!');
    } catch (dbErr) {
      console.warn('MongoDB Atlas seeding warning:', dbErr.message);
    }
  }

  console.log('✅ Showcase multi-tenant setup complete!');
}

seedMultiTenantCafes().then(() => process.exit(0)).catch(err => {
  console.error('Seed script error:', err);
  process.exit(1);
});
