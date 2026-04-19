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

const MOMO_IMAGE_MAP = [
    {
        name: "Veg Fried Momos",
        url: "https://images.unsplash.com/photo-1626804475297-41609ea084eb?auto=format&fit=crop&q=80&w=800"
    },
    {
        name: "Paneer Steam Momos",
        url: "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&q=80&w=800"
    },
    {
        name: "Paneer Fried Momos",
        url: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&q=80&w=800"
    },
    {
        name: "Veg Kurkure Momos",
        url: "https://images.unsplash.com/photo-1564834744159-ff0ea41ba4b9?auto=format&fit=crop&q=80&w=800"
    },
    {
        name: "Paneer Kurkure Momos",
        url: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&q=80&w=800"
    },
    {
        name: "Afghani Momos",
        url: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=800"
    },
    {
        name: "Tandoori Momos",
        url: "https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?auto=format&fit=crop&q=80&w=800"
    }
];

async function run() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Connected\n');

        for (const item of MOMO_IMAGE_MAP) {
            console.log(`Processing: ${item.name}`);
            try {
                // Upload direct URL to Cloudinary
                console.log(`  - Fetching and uploading to Cloudinary...`);
                const result = await cloudinary.uploader.upload(item.url, {
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
                    console.log(`  - ⚠️ Product not found in database!`);
                }
            } catch (err) {
                 console.log(`  - ❌ Failed to fetch/upload image for ${item.name}: ${err.message}`);
            }
            console.log('-----------------------------------');
        }

        console.log('\n🎉 Successfully processed backup stock images for remaining Momos!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Fatal Error:', err);
        process.exit(1);
    }
}

run();
