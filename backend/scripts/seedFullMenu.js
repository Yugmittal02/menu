const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Category = require('../models/Category');
const Product = require('../models/Product');

// ════════════════════════════════════════════════════════════════
// COMPLETE MENU DATA
// ════════════════════════════════════════════════════════════════

const MENU = {
    "Cakes": {
        icon: "🎂",
        colorFrom: "#E91E63",
        colorTo: "#F48FB1",
        sortOrder: 1,
        subcategories: [
            { name: "Pastries", image: "" },
            { name: "Cakes", image: "" }
        ],
        products: {
            "Pastries": [
                { name: "Vanilla Pastries", basePrice: 30 },
                { name: "Butterscotch Pastries", basePrice: 40 },
                { name: "Black Forest Pastries", basePrice: 40 },
                { name: "Dark Chocolate Pastries", basePrice: 50 }
            ],
            "Cakes": [
                { name: "Vanilla or Pineapple Cake", basePrice: 200, sizes: [{ name: "1lb", price: 200 }, { name: "2lb", price: 380 }] },
                { name: "Strawberry Cake", basePrice: 220, sizes: [{ name: "1lb", price: 220 }, { name: "2lb", price: 420 }] },
                { name: "Butterscotch Cake", basePrice: 250, sizes: [{ name: "1lb", price: 250 }, { name: "2lb", price: 460 }] },
                { name: "Black Forest Cake", basePrice: 270, sizes: [{ name: "1lb", price: 270 }, { name: "2lb", price: 480 }] },
                { name: "Dark Chocolate Cake", basePrice: 300, sizes: [{ name: "1lb", price: 300 }, { name: "2lb", price: 550 }] }
            ]
        }
    },
    "Fastfood": {
        icon: "🍔",
        colorFrom: "#F7971E",
        colorTo: "#FFD200",
        sortOrder: 2,
        subcategories: [
            { name: "Momos", image: "" },
            { name: "Patties", image: "" },
            { name: "Burger", image: "" },
            { name: "Maggie", image: "" },
            { name: "Sandwich", image: "" },
            { name: "French Fries", image: "" },
            { name: "Wrap & Pasta", image: "" },
            { name: "Chinese", image: "" }
        ],
        products: {
            "Momos": [
                { name: "Veg Momos", basePrice: 60 },
                { name: "Veg Fries Momos", basePrice: 70 },
                { name: "Paneer Steam Momos", basePrice: 80 },
                { name: "Paneer Fried Momos", basePrice: 90 },
                { name: "Veg Kurkure Momos", basePrice: 80 },
                { name: "Tandoori Veg Fried Momos", basePrice: 100 },
                { name: "Paneer Kurkure Momos", basePrice: 100 },
                { name: "Tandoori Paneer Fried Momos", basePrice: 120 },
                { name: "Veg Tandoori Momos", basePrice: 80 },
                { name: "Veg Afghani Momos", basePrice: 90 },
                { name: "Paneer Tandoori Momos", basePrice: 100 },
                { name: "Paneer Afghani Momos", basePrice: 120 },
                { name: "Paneer Gravy Momos", basePrice: 130 }
            ],
            "Patties": [
                { name: "Plain Masala Patties", basePrice: 15 },
                { name: "Masala Patties", basePrice: 25 },
                { name: "Paneer Patties", basePrice: 35 },
                { name: "Tandoori Patties", basePrice: 40 },
                { name: "Cheese Patties", basePrice: 40 },
                { name: "Cheese Tandoori Paneer Mayo", basePrice: 70 }
            ],
            "Burger": [
                { name: "Aloo Tikki Burger", basePrice: 50 },
                { name: "Veg Burger", basePrice: 60 },
                { name: "Veg Paneer Burger", basePrice: 60 },
                { name: "Veg Cheese Burger", basePrice: 60 },
                { name: "Tandoori Burger", basePrice: 70 },
                { name: "Schezwan Burger", basePrice: 70 },
                { name: "Makhani Burger", basePrice: 70 },
                { name: "Makhani Paneer Burger", basePrice: 80 },
                { name: "Tandoori Paneer Burger", basePrice: 80 },
                { name: "Chilly Burger", basePrice: 60 },
                { name: "Mexican Burger", basePrice: 60 },
                { name: "SPB Special Burger", basePrice: 80 }
            ],
            "Maggie": [
                { name: "Plain Maggie", basePrice: 50 },
                { name: "Veg Maggie", basePrice: 60 },
                { name: "Paneer Maggie", basePrice: 70 },
                { name: "Tandoori Maggie", basePrice: 70 },
                { name: "Corn Cheese Maggie", basePrice: 70 },
                { name: "Cheese and Butter Maggie", basePrice: 70 },
                { name: "Butter Maggie", basePrice: 60 },
                { name: "Pizza Maggie", basePrice: 80 },
                { name: "Pizza Paneer Maggie", basePrice: 90 },
                { name: "Tandoori Paneer Maggie", basePrice: 90 }
            ],
            "Sandwich": [
                { name: "Veg Sandwich", basePrice: 70 },
                { name: "Paneer Sandwich", basePrice: 80 },
                { name: "Corn Mayo Sandwich", basePrice: 80 },
                { name: "Tandoori Sandwich", basePrice: 80 },
                { name: "Paneer Special Sandwich", basePrice: 90 },
                { name: "Sev Onion Sandwich", basePrice: 80 },
                { name: "Tandoori Paneer Corn Sandwich", basePrice: 100 },
                { name: "Pizza Sandwich", basePrice: 120 }
            ],
            "French Fries": [
                { name: "Salt Fries", basePrice: 50 },
                { name: "Masala Fries", basePrice: 50 },
                { name: "Peri Peri Fries", basePrice: 60 },
                { name: "Cheese Loaded Fries", basePrice: 70 },
                { name: "Tandoori Fries", basePrice: 80 }
            ],
            "Wrap & Pasta": [
                { name: "Veg Wrap", basePrice: 70 },
                { name: "Paneer Wrap", basePrice: 80 },
                { name: "SPB Wrap", basePrice: 90 },
                { name: "Red Sauce Pasta", basePrice: 60 },
                { name: "White Sauce Pasta", basePrice: 70 },
                { name: "Pink Sauce Pasta", basePrice: 80 }
            ],
            "Chinese": [
                { name: "Chilly Paneer", basePrice: 100 },
                { name: "Honey Chili Potato", basePrice: 120 },
                { name: "Chili Garlic Noodles", basePrice: 90 },
                { name: "Veg Noodle", basePrice: 60 }
            ]
        }
    },
    "Beverages": {
        icon: "🥤",
        colorFrom: "#00B4DB",
        colorTo: "#0083B0",
        sortOrder: 3,
        subcategories: [
            { name: "Coffee & Shakes", image: "" },
            { name: "Mojitos", image: "" }
        ],
        products: {
            "Coffee & Shakes": [
                { name: "Vanilla Shake", basePrice: 60 },
                { name: "Oreo Shake", basePrice: 60 },
                { name: "Cold Coffee", basePrice: 60 },
                { name: "Kitkat Shake", basePrice: 80 },
                { name: "Blueberry Shake", basePrice: 80 },
                { name: "Cold Coffee with Ice Cream", basePrice: 70 }
            ],
            "Mojitos": [
                { name: "Classic Mojito", basePrice: 70 },
                { name: "Black Cobra", basePrice: 80 },
                { name: "Blue Ocean", basePrice: 80 },
                { name: "Virgin Mojito", basePrice: 80 }
            ]
        }
    },
    "Pizza": {
        icon: "🍕",
        colorFrom: "#FF512F",
        colorTo: "#F09819",
        sortOrder: 4,
        subcategories: [
            { name: "Pizzas", image: "" }
        ],
        products: {
            "Pizzas": [
                { name: "OTC Pizza", basePrice: 120 },
                { name: "Sweet Corn Pizza", basePrice: 140 },
                { name: "Paneer Pizza", basePrice: 170 },
                { name: "Double Cheese Pizza", basePrice: 200 },
                { name: "Extra Cheese Loaded Pizza", basePrice: 270 },
                { name: "Tandoori Paneer Pizza", basePrice: 290 }
            ]
        }
    }
};

// ════════════════════════════════════════════════════════════════

async function seed() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected\n');

        let totalProducts = 0;
        let createdProducts = 0;
        let skippedProducts = 0;

        for (const [catName, catData] of Object.entries(MENU)) {
            console.log(`\n${'═'.repeat(50)}`);
            console.log(`📦 Category: ${catName}`);
            console.log(`${'═'.repeat(50)}`);

            // Find or create category
            let category = await Category.findOne({ name: { $regex: new RegExp(`^${catName}$`, 'i') } });

            if (category) {
                // Update existing category
                category.subcategories = catData.subcategories;
                category.icon = catData.icon;
                category.colorFrom = catData.colorFrom;
                category.colorTo = catData.colorTo;
                category.sortOrder = catData.sortOrder;
                category.isActive = true;
                await category.save();
                console.log(`   ✅ Updated existing category (${category._id})`);
            } else {
                category = new Category({
                    name: catName,
                    icon: catData.icon,
                    colorFrom: catData.colorFrom,
                    colorTo: catData.colorTo,
                    sortOrder: catData.sortOrder,
                    isActive: true,
                    isQuickPick: catName === 'Fastfood',
                    subcategories: catData.subcategories
                });
                await category.save();
                console.log(`   🆕 Created new category (${category._id})`);
            }

            console.log(`   📂 Subcategories: ${catData.subcategories.map(s => s.name).join(', ')}`);

            // Create products for each subcategory
            for (const [subName, products] of Object.entries(catData.products)) {
                console.log(`\n   [${subName}] — ${products.length} items`);

                for (const prod of products) {
                    totalProducts++;

                    // Check if product already exists (by name + category)
                    const existing = await Product.findOne({
                        name: { $regex: new RegExp(`^${prod.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
                        category: category._id
                    });

                    if (existing) {
                        // Update subcategories on existing product
                        const subs = new Set(existing.subcategories || []);
                        subs.add(subName);
                        existing.subcategories = Array.from(subs);
                        existing.basePrice = prod.basePrice;
                        if (prod.sizes) existing.sizes = prod.sizes;
                        await existing.save();
                        skippedProducts++;
                        process.stdout.write('.');
                    } else {
                        const newProduct = new Product({
                            name: prod.name,
                            category: category._id,
                            basePrice: prod.basePrice,
                            subcategories: [subName],
                            sizes: prod.sizes || [],
                            isAvailable: true,
                            isBestseller: false
                        });
                        await newProduct.save();
                        createdProducts++;
                        process.stdout.write('+');
                    }
                }
            }
        }

        console.log(`\n\n${'═'.repeat(50)}`);
        console.log('📊 SEED SUMMARY');
        console.log(`${'═'.repeat(50)}`);
        console.log(`   Total items processed: ${totalProducts}`);
        console.log(`   ✅ Created: ${createdProducts}`);
        console.log(`   🔄 Updated: ${skippedProducts}`);
        console.log(`${'═'.repeat(50)}`);

        await mongoose.disconnect();
        console.log('\n🎉 Done!');
    } catch (error) {
        console.error('\n❌ Seed failed:', error.message);
        console.error(error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

seed();
