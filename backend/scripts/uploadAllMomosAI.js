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
    { name: "Veg Momos", path: "C:\\Users\\Yug Mittal\\.gemini\\antigravity\\brain\\2ef1e8cf-f97c-46e4-ab91-c0d831452c69\\veg_momos_test_1776533760291.png" },
    { name: "Veg Fries Momos", path: "C:\\Users\\Yug Mittal\\.gemini\\antigravity\\brain\\2ef1e8cf-f97c-46e4-ab91-c0d831452c69\\veg_fried_momos_ai_1776533806499.png" },
    { name: "Paneer Steam Momos", path: "C:\\Users\\Yug Mittal\\.gemini\\antigravity\\brain\\2ef1e8cf-f97c-46e4-ab91-c0d831452c69\\paneer_steam_momos_ai_1776534441023.png" },
    { name: "Paneer Fried Momos", path: "C:\\Users\\Yug Mittal\\.gemini\\antigravity\\brain\\2ef1e8cf-f97c-46e4-ab91-c0d831452c69\\paneer_fried_momos_ai_1776534468939.png" },
    { name: "Veg Kurkure Momos", path: "C:\\Users\\Yug Mittal\\.gemini\\antigravity\\brain\\2ef1e8cf-f97c-46e4-ab91-c0d831452c69\\veg_kurkure_momos_1776534766771.png" },
    { name: "Tandoori Veg Fried Momos", path: "C:\\Users\\Yug Mittal\\.gemini\\antigravity\\brain\\2ef1e8cf-f97c-46e4-ab91-c0d831452c69\\tandoori_veg_fried_momos_1776534845098.png" },
    { name: "Paneer Kurkure Momos", path: "C:\\Users\\Yug Mittal\\.gemini\\antigravity\\brain\\2ef1e8cf-f97c-46e4-ab91-c0d831452c69\\paneer_kurkure_momos_1776535014137.png" },
    { name: "Tandoori Paneer Fried Momos", path: "C:\\Users\\Yug Mittal\\.gemini\\antigravity\\brain\\2ef1e8cf-f97c-46e4-ab91-c0d831452c69\\tandoori_paneer_fried_momos_1776535047195.png" },
    { name: "Veg Tandoori Momos", path: "C:\\Users\\Yug Mittal\\.gemini\\antigravity\\brain\\2ef1e8cf-f97c-46e4-ab91-c0d831452c69\\veg_tandoori_momos_1776535064905.png" },
    { name: "Veg Afghani Momos", path: "C:\\Users\\Yug Mittal\\.gemini\\antigravity\\brain\\2ef1e8cf-f97c-46e4-ab91-c0d831452c69\\veg_afghani_momos_1776535082427.png" },
    { name: "Paneer Tandoori Momos", path: "C:\\Users\\Yug Mittal\\.gemini\\antigravity\\brain\\2ef1e8cf-f97c-46e4-ab91-c0d831452c69\\paneer_tandoori_momos_1776535106513.png" },
    { name: "Paneer Afghani Momos", path: "C:\\Users\\Yug Mittal\\.gemini\\antigravity\\brain\\2ef1e8cf-f97c-46e4-ab91-c0d831452c69\\paneer_afghani_momos_1776535122796.png" },
    { name: "Paneer Gravy Momos", path: "C:\\Users\\Yug Mittal\\.gemini\\antigravity\\brain\\2ef1e8cf-f97c-46e4-ab91-c0d831452c69\\paneer_gravy_momos_1776535144725.png" }
];

async function run() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Connected\n');

        for (const item of IMAGE_MAP) {
            console.log(`Processing: ${item.name}`);
            try {
                // Upload direct file to Cloudinary
                console.log(`  - Uploading precise AI image to Cloudinary...`);
                const result = await cloudinary.uploader.upload(item.path, {
                    folder: 'sewashubham-bakery/products',
                    resource_type: 'image'
                });
                console.log(`  - Uploaded successfully: ${result.secure_url}`);

                // Update Database
                const product = await Product.findOne({ name: item.name });
                if (product) {
                    product.image = result.secure_url;
                    await product.save();
                    console.log(`  - Product updated in database!`);
                } else {
                    console.log(`  - ⚠️ Product not found in database! (Missing: ${item.name})`);
                }
            } catch (err) {
                 console.log(`  - ❌ Failed to fetch/upload image for ${item.name}: ${err.message}`);
            }
            console.log('-----------------------------------');
        }

        console.log('\n🎉 Successfully generated and deployed ALL 13 Momos to the site!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Fatal Error:', err);
        process.exit(1);
    }
}

run();
