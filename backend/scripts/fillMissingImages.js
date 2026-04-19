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

const URLS = {
    burger: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800",
    noodles: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&q=80&w=800",
    sandwich: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&q=80&w=800",
    fries: "https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&q=80&w=800",
    pasta: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&q=80&w=800",
    wrap: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&q=80&w=800",
    drink: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=800",
    cake: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=800",
    default: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800"
};

function getImageUrlForProduct(name) {
    name = name.toLowerCase();
    if (name.includes('burger')) return URLS.burger;
    if (name.includes('maggie') || name.includes('chinese') || name.includes('noodle')) return URLS.noodles;
    if (name.includes('sandwich')) return URLS.sandwich;
    if (name.includes('fries') || name.includes('potato')) return URLS.fries;
    if (name.includes('pasta')) return URLS.pasta;
    if (name.includes('wrap') || name.includes('roll')) return URLS.wrap;
    if (name.includes('mojito') || name.includes('shake') || name.includes('coffee') || name.includes('beverage')) return URLS.drink;
    if (name.includes('cake') || name.includes('pastry') || name.includes('forest')) return URLS.cake;
    return URLS.default;
}

// Function to upload a chunk of products sequentially to avoid dropping connections
async function processBatch(products) {
    for (const product of products) {
        console.log(`Processing: ${product.name}`);
        const sourceUrl = getImageUrlForProduct(product.name);
        
        try {
            const result = await cloudinary.uploader.upload(sourceUrl, {
                folder: 'sewashubham-bakery/products',
                resource_type: 'image'
            });
            product.image = result.secure_url;
            await product.save();
            console.log(`  ✅ Uploaded and saved!`);
        } catch (err) {
            console.log(`  ❌ Failed for ${product.name}: ${err.message}`);
        }
    }
}

async function run() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Connected\n');

        // Find all products that DO NOT have an image URL
        const productsToUpdate = await Product.find({
            $or: [
                { image: "" },
                { image: null },
                { image: { $exists: false } }
            ]
        });

        console.log(`Found ${productsToUpdate.length} products needing an image placeholder.`);

        if (productsToUpdate.length > 0) {
            // Process in chunks of 10 to keep logs clean and steady
            const chunkSize = 10;
            for (let i = 0; i < productsToUpdate.length; i += chunkSize) {
                console.log(`\n▶️ Processing Chunk ${Math.floor(i/chunkSize) + 1} of ${Math.ceil(productsToUpdate.length/chunkSize)}`);
                const chunk = productsToUpdate.slice(i, i + chunkSize);
                // We run them simultaneously mapped in the chunk
                await Promise.all(chunk.map(product => {
                    const sourceUrl = getImageUrlForProduct(product.name);
                    console.log(`   ⬆️ Uploading for: ${product.name}`);
                    return cloudinary.uploader.upload(sourceUrl, {
                        folder: 'sewashubham-bakery/products',
                        resource_type: 'image'
                    }).then(res => {
                        product.image = res.secure_url;
                        return product.save();
                    }).then(() => {
                        console.log(`   ✅ Saved: ${product.name}`);
                    }).catch(err => {
                        console.log(`   ❌ Error for ${product.name}: ${err.message}`);
                    });
                }));
            }
        }

        console.log('\n🎉 ALL MISSING PRODUCT IMAGES SUCCESSFULLY POPULATED!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Fatal Error:', err);
        process.exit(1);
    }
}

run();
