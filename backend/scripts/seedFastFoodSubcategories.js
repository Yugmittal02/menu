const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Category = require('../models/Category');

const FAST_FOOD_SUBCATEGORIES = [
    { name: 'Momos', image: '' },
    { name: 'Patties', image: '' },
    { name: 'Burger', image: '' },
    { name: 'Maggie', image: '' },
    { name: 'Sandwich', image: '' },
    { name: 'French Fries', image: '' },
    { name: 'Pasta', image: '' },
    { name: 'Wrap', image: '' },
    { name: 'Mojito', image: '' },
    { name: 'Chinese', image: '' }
];

async function seed() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected\n');

        // Find the Fast Food / Fastfood category
        let fastFood = await Category.findOne({ name: 'Fastfood' });
        if (!fastFood) {
            fastFood = await Category.findOne({ name: 'Fast Food' });
        }
        if (!fastFood) {
            // Search case-insensitively
            fastFood = await Category.findOne({ name: { $regex: /fast\s*food/i } });
        }

        if (!fastFood) {
            console.log('❌ Fast Food category not found in database.');
            console.log('   Please create it first via Admin Panel → Categories.');
            await mongoose.disconnect();
            return;
        }

        console.log(`📦 Found category: "${fastFood.name}" (${fastFood._id})`);

        // Migrate old string subcategories to {name, image} objects
        const currentSubs = fastFood.subcategories || [];
        let migrated = false;
        const migratedSubs = currentSubs.map(sub => {
            if (typeof sub === 'string') {
                migrated = true;
                return { name: sub, image: '' };
            }
            // Already an object (has .name)
            return sub;
        });

        if (migrated) {
            console.log(`🔄 Migrated ${currentSubs.length} old string subcategories to object format`);
            fastFood.subcategories = migratedSubs;
            await fastFood.save();
        }

        console.log(`   Current subcategories: ${(fastFood.subcategories || []).map(s => s.name || s).join(', ') || 'None'}\n`);

        // Merge new subcategories with existing (avoid duplicates by name)
        const existingNames = new Set((fastFood.subcategories || []).map(s => (s.name || '').toLowerCase()));
        const toAdd = FAST_FOOD_SUBCATEGORIES.filter(s => !existingNames.has(s.name.toLowerCase()));

        if (toAdd.length === 0) {
            console.log('✅ All subcategories already exist. Nothing to add.');
        } else {
            fastFood.subcategories = [...(fastFood.subcategories || []), ...toAdd];
            await fastFood.save();

            console.log(`✅ Added ${toAdd.length} subcategories:`);
            toAdd.forEach(s => console.log(`   + ${s.name}`));
            console.log(`\n📋 Final subcategories: ${fastFood.subcategories.map(s => s.name).join(', ')}`);
        }

        await mongoose.disconnect();
        console.log('\n🎉 Done!');
    } catch (error) {
        console.error('❌ Seed failed:', error.message);
        await mongoose.disconnect();
        process.exit(1);
    }
}

seed();
