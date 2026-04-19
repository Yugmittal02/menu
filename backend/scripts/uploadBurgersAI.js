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
    { name: "Aloo Tikki Burger", path: "C:\\Users\\Yug Mittal\\.gemini\\antigravity\\brain\\2ef1e8cf-f97c-46e4-ab91-c0d831452c69\\aloo_tikki_burger_1776535638617.png" },
    { name: "Veg Burger", path: "C:\\Users\\Yug Mittal\\.gemini\\antigravity\\brain\\2ef1e8cf-f97c-46e4-ab91-c0d831452c69\\veg_burger_1776535661372.png" },
    { name: "Veg Paneer Burger", path: "C:\\Users\\Yug Mittal\\.gemini\\antigravity\\brain\\2ef1e8cf-f97c-46e4-ab91-c0d831452c69\\veg_paneer_burger_1776535677769.png" },
    { name: "Veg Cheese Burger", path: "C:\\Users\\Yug Mittal\\.gemini\\antigravity\\brain\\2ef1e8cf-f97c-46e4-ab91-c0d831452c69\\veg_cheese_burger_1776535693195.png" },
    { name: "Tandoori Burger", path: "C:\\Users\\Yug Mittal\\.gemini\\antigravity\\brain\\2ef1e8cf-f97c-46e4-ab91-c0d831452c69\\tandoori_burger_1776535722525.png" }
];

async function run() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Connected\n');

        for (const item of IMAGE_MAP) {
            console.log(`Processing: ${item.name}`);
            try {
                const result = await cloudinary.uploader.upload(item.path, {
                    folder: 'sewashubham-bakery/products',
                    resource_type: 'image'
                });
                console.log(`  - Uploaded successfully: ${result.secure_url}`);

                const product = await Product.findOne({ name: item.name });
                if (product) {
                    product.image = result.secure_url;
                    await product.save();
                    console.log(`  - Product updated in database!`);
                }
            } catch (err) {
                 console.log(`  - ❌ Failed to fetch/upload image for ${item.name}: ${err.message}`);
            }
            console.log('-----------------------------------');
        }

        console.log('\n🎉 Successfully uploaded the 5 successful Burgers!');
        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
}

run();
