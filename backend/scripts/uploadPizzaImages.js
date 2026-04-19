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
        name: "OTC Pizza",
        path: "C:\\Users\\Yug Mittal\\.gemini\\antigravity\\brain\\2ef1e8cf-f97c-46e4-ab91-c0d831452c69\\otc_pizza_1776532720241.png"
    },
    {
        name: "Sweet Corn Pizza",
        path: "C:\\Users\\Yug Mittal\\.gemini\\antigravity\\brain\\2ef1e8cf-f97c-46e4-ab91-c0d831452c69\\sweet_corn_pizza_1776532735832.png"
    },
    {
        name: "Paneer Pizza",
        path: "C:\\Users\\Yug Mittal\\.gemini\\antigravity\\brain\\2ef1e8cf-f97c-46e4-ab91-c0d831452c69\\paneer_pizza_1776532755070.png"
    },
    {
        name: "Double Cheese Pizza",
        path: "C:\\Users\\Yug Mittal\\.gemini\\antigravity\\brain\\2ef1e8cf-f97c-46e4-ab91-c0d831452c69\\double_cheese_pizza_1776532781873.png"
    },
    {
        name: "Extra Cheese Loaded Pizza",
        path: "C:\\Users\\Yug Mittal\\.gemini\\antigravity\\brain\\2ef1e8cf-f97c-46e4-ab91-c0d831452c69\\extra_cheese_loaded_pizza_1776532796090.png"
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

        console.log('\n🎉 Successfully processed completed pizza images!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

run();
