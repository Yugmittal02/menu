const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Category = require('../models/Category');

async function mergeDuplicates() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected\n');

        const productsCol = mongoose.connection.db.collection('products');

        // Find both
        const cake = await Category.findOne({ name: 'Cake' });
        const cakes = await Category.findOne({ name: 'Cakes' });

        if (!cake && !cakes) {
            console.log('❌ Neither "Cake" nor "Cakes" category found. Nothing to do.');
            await mongoose.disconnect();
            return;
        }

        if (cake && !cakes) {
            console.log('ℹ️  Only "Cake" exists — no duplicate "Cakes" found.');
            // Still rename to "Cakes"
            cake.name = 'Cakes';
            cake.slug = 'cakes';
            cake.icon = '🎂';
            await cake.save();
            console.log(`✅ Renamed "Cake" → "Cakes" (slug: cakes, icon: 🎂)`);
            await mongoose.disconnect();
            return;
        }

        if (!cake && cakes) {
            console.log('ℹ️  Only "Cakes" exists — no "Cake" to merge.');
            cakes.icon = '🎂';
            await cakes.save();
            console.log('✅ Ensured "Cakes" has icon 🎂');
            await mongoose.disconnect();
            return;
        }

        // Both exist — merge
        console.log(`📋 Found duplicates:`);
        console.log(`   "Cake"  → ${cake._id} (slug: ${cake.slug})`);
        console.log(`   "Cakes" → ${cakes._id} (slug: ${cakes.slug})\n`);

        // Step 1: Reassign all products from "Cakes" to "Cake"
        const result = await productsCol.updateMany(
            { category: cakes._id },
            { $set: { category: cake._id } }
        );
        console.log(`🔄 Reassigned ${result.modifiedCount} products from "Cakes" → "Cake"`);

        // Step 2: Delete the "Cakes" duplicate
        await Category.deleteOne({ _id: cakes._id });
        console.log(`🗑️  Deleted duplicate "Cakes" category (${cakes._id})`);

        // Step 3: Rename the remaining "Cake" → "Cakes"
        cake.name = 'Cakes';
        cake.slug = 'cakes';
        cake.icon = '🎂';
        await cake.save();
        console.log(`✏️  Renamed "Cake" → "Cakes" (slug: cakes, icon: 🎂)`);

        // Summary
        const finalCategory = await Category.findById(cake._id);
        const productCount = await productsCol.countDocuments({ category: cake._id });
        console.log(`\n✅ DONE — Final state:`);
        console.log(`   Name: ${finalCategory.name}`);
        console.log(`   Slug: ${finalCategory.slug}`);
        console.log(`   Icon: ${finalCategory.icon}`);
        console.log(`   ID:   ${finalCategory._id}`);
        console.log(`   Products assigned: ${productCount}`);

        await mongoose.disconnect();
    } catch (error) {
        console.error('❌ Error:', error.message);
        await mongoose.disconnect();
        process.exit(1);
    }
}

mergeDuplicates();
