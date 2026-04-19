const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');
const path = require('path');
const Product = require('../models/Product');

// Load env vars
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const IMAGE_MAP = [
    {
        name: "Plain Masala Patties",
        path: "C:\\Users\\Yug Mittal\\.gemini\\antigravity\\brain\\2ef1e8cf-f97c-46e4-ab91-c0d831452c69\\plain_masala_patties_1776531910762.png"
    },
    {
        name: "Masala Patties",
        path: "C:\\Users\\Yug Mittal\\.gemini\\antigravity\\brain\\2ef1e8cf-f97c-46e4-ab91-c0d831452c69\\masala_patties_1776531924641.png"
    },
    {
        name: "Paneer Patties",
        path: "C:\\Users\\Yug Mittal\\.gemini\\antigravity\\brain\\2ef1e8cf-f97c-46e4-ab91-c0d831452c69\\paneer_patties_1776531941099.png"
    },
    {
        name: "Tandoori Patties",
        path: "C:\\Users\\Yug Mittal\\.gemini\\antigravity\\brain\\2ef1e8cf-f97c-46e4-ab91-c0d831452c69\\tandoori_patties_1776531965534.png"
    },
    {
        name: "Cheese Patties",
        path: "C:\\Users\\Yug Mittal\\.gemini\\antigravity\\brain\\2ef1e8cf-f97c-46e4-ab91-c0d831452c69\\cheese_patties_1776531980295.png"
    },
    {
        name: "Cheese Tandoori Paneer Mayo",
        path: "C:\\Users\\Yug Mittal\\.gemini\\antigravity\\brain\\2ef1e8cf-f97c-46e4-ab91-c0d831452c69\\cheese_tandoori_paneer_mayo_1776531998328.png"
    }
];

async function run() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Connected\n');

        for (const item of IMAGE_MAP) {
            console.log(`Processing: ${item.name}`);
            
            // 1. Upload to Cloudinary
            console.log(`  - Uploading to Cloudinary...`);
            const result = await cloudinary.uploader.upload(item.path, {
                folder: 'sewashubham-bakery/products',
                resource_type: 'image'
            });
            console.log(`  - Uploaded successfully: ${result.secure_url}`);

            // 2. Update Product in Database
            const product = await Product.findOne({ name: item.name });
            if (product) {
                product.image = result.secure_url;
                await product.save();
                console.log(`  - Product updated in database!`);
            } else {
                console.log(`  - ⚠️ Product not found in database!`);
            }
            console.log('-----------------------------------');
        }

        console.log('\n🎉 All images processed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

run();
