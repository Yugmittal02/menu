const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Category = require('../models/Category');
const Product = require('../models/Product');

// ════════════════════════════════════════════════════════════════
// ONLY NEW ITEMS THAT ARE MISSING FROM THE DATABASE
// ════════════════════════════════════════════════════════════════
//
// Existing DB has 95 products. The user's full Python menu has
// additional items that were never seeded. This script adds
// ONLY the missing ones.
//
// Comparison done manually against the DB dump:
//
// PATTIES — DB has 6, menu has 12. Missing 6:
//   Cheese Tandoori Patties, Cheese Paneer Patties,
//   Cheese Tandoori Paneer Patties, Tandoori Paneer Patties,
//   Tandoori Mayo Patties, Mayonnaise Patties
//
// MOMOS — DB has "Veg Fries Momos", menu has "Veg Fried Momos".
//   These are the same item with slightly different names. Skip.
//   All 13 momos already exist. Nothing missing.
//
// BURGER — All 12 exist. Nothing missing.
//
// MAGGIE — All 10 exist. Nothing missing.
//
// SANDWICH — All 8 exist. Nothing missing.
//
// FRENCH FRIES — All 5 exist. Nothing missing.
//
// WRAP — All 3 exist (under "Wrap & Pasta"). Nothing missing.
//
// PASTA — DB has 3 (Red, White, Pink). Menu has 6. Missing 3:
//   Cheese Red Pasta, Tandoori Sauce Pasta, Makhani Sauce Pasta
//   NOTE: These need subcategory "Wrap & Pasta" to match existing.
//         But user's menu separates Pasta from Wrap. We'll use
//         the existing "Wrap & Pasta" subcategory since that's
//         what the DB already uses.
//
// CHINESE — DB has 4. Menu has 8. Missing 4:
//   Garlic Chili Potato, Chili Potato, Singapore Noodles, Hakka Noodles
//
// PIZZA — DB has 6. Menu has 12. Missing 6:
//   Four In One Pizza, Golden Baby Pizza, Makhani Pizza,
//   Makhani Paneer Pizza, Tandoori Pizza, SPB Special Pizza
//
// BEVERAGES / Coffee & Shakes — DB has 6. Menu has 19. Missing 13:
//   Strawberry Shake, Butterscotch Shake, Pineapple Shake,
//   Rajbhog Shake, American Nuts Shake, Kesar Pista Shake,
//   Rose Milk Shake, Pan Shake, Black Current Shake,
//   Anzeer Shake, Papaya Shake, Mango Shake, Chocolate Shake
//
// BEVERAGES / Mojito — DB has 4. Menu has 8. Missing 4:
//   Apple Peach Mojito, Watermelon Mojito,
//   Blackcurrant Mojito, Strawberry Mojito
//
// CAKES / Cakes — All 5 exist. Nothing missing.
//
// CAKES / Pastries — All 4 exist (as "Vanilla Pastries" etc). OK.
//
// BAKERY — "Bakery" category exists but has no pastries from the
//   user's menu. The user's Python menu puts Pastries under "Bakery"
//   but the DB already has them under "Cakes". We will NOT re-add
//   duplicates. Skip entirely.
//
// ════════════════════════════════════════════════════════════════

const MISSING_ITEMS = {
    // Category name → { subcategory → [ items ] }
    "Fastfood": {
        "Patties": [
            { name: "Cheese Tandoori Patties", basePrice: 50 },
            { name: "Cheese Paneer Patties", basePrice: 50 },
            { name: "Cheese Tandoori Paneer Patties", basePrice: 60 },
            { name: "Tandoori Paneer Patties", basePrice: 50 },
            { name: "Tandoori Mayo Patties", basePrice: 50 },
            { name: "Mayonnaise Patties", basePrice: 25 }
        ],
        "Wrap & Pasta": [
            { name: "Cheese Red Pasta", basePrice: 80 },
            { name: "Tandoori Sauce Pasta", basePrice: 80 },
            { name: "Makhani Sauce Pasta", basePrice: 80 }
        ],
        "Chinese": [
            { name: "Garlic Chili Potato", basePrice: 130 },
            { name: "Chili Potato", basePrice: 80 },
            { name: "Singapore Noodles", basePrice: 100 },
            { name: "Hakka Noodles", basePrice: 80 }
        ]
    },
    "Pizza": {
        "Pizzas": [
            { name: "Four In One Pizza", basePrice: 230 },
            { name: "Golden Baby Pizza", basePrice: 250 },
            { name: "Makhani Pizza", basePrice: 220 },
            { name: "Makhani Paneer Pizza", basePrice: 250 },
            { name: "Tandoori Pizza", basePrice: 220 },
            { name: "SPB Special Pizza", basePrice: 300 }
        ]
    },
    "Beverages": {
        "Coffee & Shakes": [
            { name: "Strawberry Shake", basePrice: 60 },
            { name: "Butterscotch Shake", basePrice: 60 },
            { name: "Pineapple Shake", basePrice: 60 },
            { name: "Rajbhog Shake", basePrice: 100 },
            { name: "American Nuts Shake", basePrice: 100 },
            { name: "Kesar Pista Shake", basePrice: 100 },
            { name: "Rose Milk Shake", basePrice: 100 },
            { name: "Pan Shake", basePrice: 100 },
            { name: "Black Current Shake", basePrice: 100 },
            { name: "Anzeer Shake", basePrice: 110 },
            { name: "Papaya Shake", basePrice: 50 },
            { name: "Mango Shake", basePrice: 60 },
            { name: "Chocolate Shake", basePrice: 60 }
        ],
        "Mojitos": [
            { name: "Apple Peach Mojito", basePrice: 80 },
            { name: "Watermelon Mojito", basePrice: 80 },
            { name: "Blackcurrant Mojito", basePrice: 80 },
            { name: "Strawberry Mojito", basePrice: 80 }
        ]
    }
};

async function addMissing() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected\n');

        let created = 0;
        let skipped = 0;

        for (const [catName, subcats] of Object.entries(MISSING_ITEMS)) {
            console.log(`\n${'═'.repeat(50)}`);
            console.log(`📦 Category: ${catName}`);
            console.log(`${'═'.repeat(50)}`);

            // Find the existing category
            const category = await Category.findOne({
                name: { $regex: new RegExp(`^${catName}$`, 'i') }
            });

            if (!category) {
                console.log(`   ❌ Category "${catName}" not found! Skipping.`);
                continue;
            }

            console.log(`   Found category: ${category.name} (${category._id})`);

            for (const [subName, items] of Object.entries(subcats)) {
                console.log(`\n   📂 Subcategory: ${subName} — ${items.length} items to add`);

                for (const item of items) {
                    // STRICT duplicate check: by exact name + category
                    const existing = await Product.findOne({
                        name: { $regex: new RegExp(`^${item.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
                        category: category._id
                    });

                    if (existing) {
                        console.log(`      ⏩ SKIP (already exists): ${item.name}`);
                        skipped++;
                        continue;
                    }

                    // Create the new product
                    const newProduct = new Product({
                        name: item.name,
                        category: category._id,
                        basePrice: item.basePrice,
                        subcategories: [subName],
                        sizes: item.sizes || [],
                        isAvailable: true,
                        isBestseller: false
                    });

                    await newProduct.save();
                    created++;
                    console.log(`      ✅ ADDED: ${item.name} (₹${item.basePrice})`);
                }
            }
        }

        console.log(`\n${'═'.repeat(50)}`);
        console.log('📊 SUMMARY');
        console.log(`${'═'.repeat(50)}`);
        console.log(`   ✅ Created:  ${created}`);
        console.log(`   ⏩ Skipped:  ${skipped}`);
        console.log(`${'═'.repeat(50)}`);

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

addMissing();
