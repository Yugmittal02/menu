const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');
const path = require('path');
const Category = require('../models/Category');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const IMAGE_MAP = [
    { name: "Momos", path: "C:\\Users\\Yug Mittal\\.gemini\\antigravity\\brain\\d0f0a6d3-ca44-4f10-a07d-0510508b778d\\momos_notext_1776581482480.png" },
    { name: "Patties", path: "C:\\Users\\Yug Mittal\\.gemini\\antigravity\\brain\\d0f0a6d3-ca44-4f10-a07d-0510508b778d\\patties_notext_1776581500991.png" },
    { name: "Burger", path: "C:\\Users\\Yug Mittal\\.gemini\\antigravity\\brain\\d0f0a6d3-ca44-4f10-a07d-0510508b778d\\burger_notext_1776581519452.png" },
    { name: "Maggie", path: "C:\\Users\\Yug Mittal\\.gemini\\antigravity\\brain\\d0f0a6d3-ca44-4f10-a07d-0510508b778d\\maggie_notext_1776581538437.png" },
    { name: "Sandwich", path: "C:\\Users\\Yug Mittal\\.gemini\\antigravity\\brain\\d0f0a6d3-ca44-4f10-a07d-0510508b778d\\sandwich_notext_1776581558285.png" },
    { name: "French Fries", path: "C:\\Users\\Yug Mittal\\.gemini\\antigravity\\brain\\d0f0a6d3-ca44-4f10-a07d-0510508b778d\\french_fries_notext_1776581580003.png" },
    { name: "Wrap & Pasta", path: "C:\\Users\\Yug Mittal\\.gemini\\antigravity\\brain\\d0f0a6d3-ca44-4f10-a07d-0510508b778d\\wrap_pasta_notext_1776581601378.png" },
    { name: "Chinese", path: "C:\\Users\\Yug Mittal\\.gemini\\antigravity\\brain\\d0f0a6d3-ca44-4f10-a07d-0510508b778d\\chinese_subcat_1776577836258.png" }
];

async function run() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Connected\n');

        let fastFoodCategory = await Category.findOne({ name: { $regex: /fast\s*food/i } });
        if (!fastFoodCategory) {
            fastFoodCategory = await Category.findOne({ name: 'Fastfood' });
        }

        if (!fastFoodCategory) {
            console.error('❌ Could not find "Fast Food" category in the DB. Exiting.');
            process.exit(1);
        }

        console.log(`📦 Found category: "${fastFoodCategory.name}"`);

        let updatedCount = 0;
        for (const item of IMAGE_MAP) {
            console.log(`\nProcessing Subcategory: ${item.name}`);
            try {
                const subCatIndex = fastFoodCategory.subcategories.findIndex(
                    sub => sub.name.toLowerCase() === item.name.toLowerCase()
                );

                if (subCatIndex === -1) {
                    console.log(`  - ❌ Subcategory "${item.name}" not found in Fast Food. Skipping.`);
                    continue;
                }

                console.log(`  - Uploading image to Cloudinary...`);
                const result = await cloudinary.uploader.upload(item.path, {
                    folder: 'sewashubham-bakery/subcategories',
                    resource_type: 'image'
                });
                console.log(`  - Uploaded successfully: ${result.secure_url}`);

                fastFoodCategory.subcategories[subCatIndex].image = result.secure_url;
                updatedCount++;
                console.log(`  - Subcategory image referenced!`);
                
            } catch (err) {
                 console.log(`  - ❌ Failed to fetch/upload image for ${item.name}: ${err.message}`);
            }
        }

        if (updatedCount > 0) {
            await fastFoodCategory.save();
            console.log(`\n💾 Saved ${updatedCount} subcategory images to database!`);
        }

        console.log('\n🎉 Finished Subcategory Image Update process!');
        process.exit(0);
    } catch (err) {
        console.error('\n❌ Fatal Error:', err.message);
        process.exit(1);
    }
}

run();
