const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');
const path = require('path');
const Product = require('../models/Product');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const IMAGE_MAP = [
    { name: "Plain Maggie", path: "C:\\Users\\Yug Mittal\\.gemini\\antigravity\\brain\\d0f0a6d3-ca44-4f10-a07d-0510508b778d\\plain_maggie_1776586871417.png" },
    { name: "Veg Maggie", path: "C:\\Users\\Yug Mittal\\.gemini\\antigravity\\brain\\d0f0a6d3-ca44-4f10-a07d-0510508b778d\\veg_maggie_1776586904481.png" },
    { name: "Paneer Maggie", path: "C:\\Users\\Yug Mittal\\.gemini\\antigravity\\brain\\d0f0a6d3-ca44-4f10-a07d-0510508b778d\\paneer_maggie_1776587115377.png" },
    { name: "Tandoori Maggie", path: "C:\\Users\\Yug Mittal\\.gemini\\antigravity\\brain\\d0f0a6d3-ca44-4f10-a07d-0510508b778d\\tandoori_maggie_1776587190683.png" },
    { name: "Corn Cheese Maggie", path: "C:\\Users\\Yug Mittal\\.gemini\\antigravity\\brain\\d0f0a6d3-ca44-4f10-a07d-0510508b778d\\corn_cheese_maggie_1776587255062.png" },
    { name: "Cheese and Butter Maggie", path: "C:\\Users\\Yug Mittal\\.gemini\\antigravity\\brain\\d0f0a6d3-ca44-4f10-a07d-0510508b778d\\cheese_and_butter_maggie_1776587411970.png" },
    { name: "Butter Maggie", path: "C:\\Users\\Yug Mittal\\.gemini\\antigravity\\brain\\d0f0a6d3-ca44-4f10-a07d-0510508b778d\\butter_maggie_1776587621944.png" }
];

async function run() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Connected\n');

        let updatedCount = 0;
        for (const item of IMAGE_MAP) {
            console.log(`\nProcessing Subcategory Product: ${item.name}`);
            try {
                const product = await Product.findOne({ name: item.name });

                if (!product) {
                    console.log(`  - ❌ Product "${item.name}" not found. Skipping.`);
                    continue;
                }

                console.log(`  - Uploading to Cloudinary...`);
                const result = await cloudinary.uploader.upload(item.path, {
                    folder: 'sewashubham-bakery/products',
                    resource_type: 'image'
                });
                
                product.image = result.secure_url;
                await product.save();
                updatedCount++;
                console.log(`  - ✅ Uploaded: ${result.secure_url}`);
            } catch (err) {
                 console.log(`  - ❌ Error: ${err.message}`);
            }
        }

        console.log(`\n🎉 Uploaded ${updatedCount} Momo images to database!`);
        process.exit(0);
    } catch (err) {
        console.error('\n❌ Fatal Error:', err.message);
        process.exit(1);
    }
}

run();
