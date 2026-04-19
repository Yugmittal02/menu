const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
const Product = require('../models/Product');

// Fix the 5 items that had trailing spaces or different names
const FIXES = {
    "Light Chocolate Cake ": "हल्की मिठास वाला सॉफ्ट चॉकलेट केक, चॉकलेट लवर्स के लिए परफेक्ट। A light and fluffy chocolate sponge cake with smooth chocolate cream.",
    "Butterscotch cake ": "क्रंची बटरस्कॉच टॉपिंग वाला मलाईदार केक। Rich butterscotch flavoured cake topped with crunchy caramel praline pieces.",
    "Chocolate Anniversary cake ": "एनिवर्सरी स्पेशल प्रीमियम चॉकलेट केक, खूबसूरत डेकोरेशन के साथ। Grand celebration chocolate cake with premium decorations, perfect for anniversaries.",
    "Doll cake ": "बच्चों की पार्टी के लिए स्पेशल डॉल शेप का डिज़ाइनर केक। Beautifully designed doll-shaped cake, a magical centerpiece for kids' birthday parties.",
    "Vanilla Cake": "क्लासिक सॉफ्ट वनीला केक — हर मौके के लिए परफेक्ट। Classic soft vanilla cake with fresh cream — perfect for every occasion."
};

async function fixRemaining() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected\n');

        // Find all products that still don't have a description
        const products = await Product.find({
            $or: [
                { description: null },
                { description: '' },
                { description: { $exists: false } }
            ]
        });

        console.log('Found', products.length, 'products without descriptions:\n');
        
        let fixed = 0;
        for (const product of products) {
            // Try exact match first, then trimmed match
            let desc = FIXES[product.name];
            if (!desc) {
                desc = FIXES[product.name.trim()];
            }

            if (desc) {
                product.description = desc;
                await product.save();
                fixed++;
                console.log('FIXED:', product.name);
            } else {
                console.log('STILL MISSING:', '[' + product.name + ']');
            }
        }

        console.log('\nFixed:', fixed, '/', products.length);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

fixRemaining();
