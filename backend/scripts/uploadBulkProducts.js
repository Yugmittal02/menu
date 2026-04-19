// backend/scripts/uploadBulkProducts.js

const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const Product = require('../models/Product');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// The directory where all 65 Fast Food Item images are stored (or will be stored)
const IMAGE_DIRECTORY = 'C:\\path\\to\\your\\fastfood_images';

async function run() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Connected\n');

        if (!fs.existsSync(IMAGE_DIRECTORY)) {
            console.error(`❌ The directory ${IMAGE_DIRECTORY} does not exist. Please create it and add your images.`);
            process.exit(1);
        }

        const files = fs.readdirSync(IMAGE_DIRECTORY);
        
        let updatedCount = 0;

        for (const file of files) {
            // "Veg Momos.png" -> "Veg Momos"
            const productName = path.parse(file).name;
            const fullPath = path.join(IMAGE_DIRECTORY, file);

            const product = await Product.findOne({ name: productName });

            if (product) {
                 console.log(`\nProcessing Product: ${productName}`);
                 try {
                     const result = await cloudinary.uploader.upload(fullPath, {
                        folder: 'sewashubham-bakery/products',
                        resource_type: 'image'
                     });
                     console.log(`  - Uploaded successfully: ${result.secure_url}`);
                     
                     product.image = result.secure_url;
                     await product.save();
                     updatedCount++;
                     console.log(`  - Product updated in database!`);
                 } catch (err) {
                     console.log(`  - ❌ Failed to upload: ${err.message}`);
                 }
            }
        }

        console.log(`\n🎉 Successfully uploaded and synced ${updatedCount} product images!`);
        process.exit(0);
    } catch (err) {
        console.error('Fatal Error:', err);
        process.exit(1);
    }
}

run();
