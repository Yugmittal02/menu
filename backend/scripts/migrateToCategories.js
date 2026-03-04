const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Only import Category — we use raw MongoDB for Product to avoid schema cast errors
const Category = require('../models/Category');

// Seed data from the plan
const CATEGORY_SEED = {
    'Cake':      { icon: '🎂', colorFrom: '#FF6B6B', colorTo: '#FF8E53', sortOrder: 1 },
    'Fastfood':  { icon: '🍔', colorFrom: '#F7971E', colorTo: '#FFD200', sortOrder: 2 },
    'Bakery':    { icon: '🍞', colorFrom: '#56AB2F', colorTo: '#A8E063', sortOrder: 3 },
    'Beverages': { icon: '☕', colorFrom: '#4FACFE', colorTo: '#00F2FE', sortOrder: 4 },
    'Flowers':   { icon: '🌸', colorFrom: '#F093FB', colorTo: '#F5576C', sortOrder: 5 },
    'Sweets':    { icon: '🍬', colorFrom: '#FA709A', colorTo: '#FEE140', sortOrder: 6 },
    'Namkeen':   { icon: '🥨', colorFrom: '#A8EDEA', colorTo: '#FED6E3', sortOrder: 7 },
    'Pizza':     { icon: '🍕', colorFrom: '#FF9A9E', colorTo: '#FECFEF', sortOrder: 8 },
};

async function migrate() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected\n');

        // Use raw MongoDB — Product model expects ObjectId now but DB still has strings
        const productsCol = mongoose.connection.db.collection('products');
        const rawProducts = await productsCol.find({}).toArray();
        
        const uniqueCategories = [...new Set(
            rawProducts
                .map(p => p.category)
                .filter(c => c && typeof c === 'string')
        )];

        console.log(`📋 Found ${uniqueCategories.length} string categories in products: ${uniqueCategories.join(', ')}\n`);

        // Step 1: Create Category documents
        const categoryMap = {};
        
        for (const catName of uniqueCategories) {
            let category = await Category.findOne({ name: catName });
            if (!category) {
                const seed = CATEGORY_SEED[catName] || { icon: '📦', colorFrom: '#F97316', colorTo: '#FB923C', sortOrder: 99 };
                category = await Category.create({
                    name: catName,
                    ...seed,
                    isActive: true,
                    isQuickPick: true
                });
                console.log(`  ✅ Created: ${seed.icon} ${catName} → ${category._id}`);
            } else {
                console.log(`  ⏩ Exists: ${catName} → ${category._id}`);
            }
            categoryMap[catName] = category._id;
        }

        // Seed extra categories from CATEGORY_SEED not in products
        for (const [name, data] of Object.entries(CATEGORY_SEED)) {
            if (!categoryMap[name]) {
                let category = await Category.findOne({ name });
                if (!category) {
                    category = await Category.create({ name, ...data, isActive: true, isQuickPick: true });
                    console.log(`  ✅ Seeded: ${data.icon} ${name} → ${category._id}`);
                }
            }
        }

        // Step 2: Update products — string → ObjectId
        console.log('\n🔄 Updating products...');
        let updated = 0, skipped = 0;

        for (const product of rawProducts) {
            if (typeof product.category !== 'string') {
                skipped++;
                continue;
            }
            const categoryId = categoryMap[product.category];
            if (categoryId) {
                await productsCol.updateOne(
                    { _id: product._id },
                    { $set: { category: categoryId } }
                );
                updated++;
            } else {
                console.log(`  ⚠️  No mapping for "${product.name}" (category: "${product.category}")`);
            }
        }

        console.log(`\n✅ Done!`);
        console.log(`   📦 Categories: ${Object.keys(categoryMap).length}`);
        console.log(`   🔄 Products updated: ${updated}`);
        console.log(`   ⏩ Skipped: ${skipped}`);

        await mongoose.disconnect();
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        await mongoose.disconnect();
        process.exit(1);
    }
}

migrate();
