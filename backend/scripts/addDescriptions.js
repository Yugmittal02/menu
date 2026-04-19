const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
const Product = require('../models/Product');

// ════════════════════════════════════════════════════════════════
// English-only customer-friendly descriptions for ALL products
// ════════════════════════════════════════════════════════════════

const DESCRIPTIONS = {
    // ─────────────── CAKES ───────────────
    "Light Chocolate Cake": "A light and fluffy chocolate sponge cake with smooth chocolate cream — perfect for chocolate lovers.",
    "Butterscotch cake": "Rich butterscotch flavoured cake topped with crunchy caramel praline pieces.",
    "Chocolate Anniversary cake": "Grand celebration chocolate cake with premium decorations — perfect for anniversaries and special occasions.",
    "Doll cake": "Beautifully designed doll-shaped cake — a magical centerpiece for kids' birthday parties.",
    "Chocolate Truffle Cake": "Indulgent dark chocolate truffle cake layered with ganache — a chocolate lover's dream.",
    "Vanilla or Pineapple Cake": "Choose between classic soft vanilla or tangy fresh pineapple cake. Available in 1lb & 2lb.",
    "Vanilla Cake": "Classic soft vanilla cake with fresh cream — perfect for every occasion.",
    "Strawberry Cake": "Delightful pink strawberry flavoured cake with a sweet, fruity taste in every bite.",
    "Butterscotch Cake": "Creamy butterscotch cake loaded with crunchy caramel chips and smooth whipped cream.",
    "Black Forest Cake": "Classic German-style cake with chocolate sponge, whipped cream, and juicy cherries.",
    "Dark Chocolate Cake": "Intensely rich dark chocolate cake with velvety ganache — a premium dessert experience.",

    // ─────────────── PASTRIES ───────────────
    "Vanilla Pastries": "Soft vanilla sponge layered with fresh cream — a simple, sweet, delightful treat.",
    "Butterscotch Pastries": "Butterscotch cream pastry topped with crunchy caramel praline bits.",
    "Black Forest Pastries": "Mini Black Forest delight — chocolate sponge with cherry filling and whipped cream.",
    "Dark Chocolate Pastries": "Rich dark chocolate pastry with smooth ganache — for true chocolate lovers.",

    // ─────────────── MOMOS ───────────────
    "Veg Momos": "Steamed dumplings stuffed with fresh mixed vegetables, served with spicy red chutney.",
    "Veg Fries Momos": "Crispy deep-fried veg momos — golden crunchy outside, soft veggie filling inside.",
    "Paneer Steam Momos": "Soft steamed momos filled with seasoned cottage cheese (paneer), served with tangy chutney.",
    "Paneer Fried Momos": "Golden fried momos stuffed with spiced paneer — crispy, cheesy, and irresistible.",
    "Veg Kurkure Momos": "Extra crunchy breadcrumb-coated veg momos — the crunchiest momos you'll ever taste!",
    "Tandoori Veg Fried Momos": "Fried veg momos marinated in smoky tandoori spices — bold flavour in every bite.",
    "Paneer Kurkure Momos": "Paneer-stuffed momos coated in crunchy breadcrumbs — cheesy inside, super crispy outside.",
    "Tandoori Paneer Fried Momos": "Spicy tandoori-marinated paneer momos, deep fried to golden perfection.",
    "Veg Tandoori Momos": "Roasted veg momos tossed in rich tandoori masala — smoky and flavourful.",
    "Veg Afghani Momos": "Veg momos drenched in rich, creamy white Afghani sauce — mild and buttery.",
    "Paneer Tandoori Momos": "Paneer momos coated in fiery tandoori sauce — smoky, spicy, and loaded with flavour.",
    "Paneer Afghani Momos": "Paneer momos smothered in creamy Afghani white gravy — rich, buttery perfection.",
    "Paneer Gravy Momos": "Paneer momos swimming in a hot, spiced tomato-based curry gravy — a complete meal!",

    // ─────────────── PATTIES ───────────────
    "Plain Masala Patties": "Simple flaky puff pastry with a light masala seasoning — a quick, tasty snack.",
    "Masala Patties": "Hot & crispy puff pastry stuffed with spiced potato masala filling.",
    "Paneer Patties": "Flaky golden patties stuffed with rich, spiced cottage cheese (paneer) filling.",
    "Tandoori Patties": "Crispy patties filled with smoky tandoori-spiced potato — bold and flavourful.",
    "Cheese Patties": "Flaky pastry oozing with hot, melted cheese inside — pure cheesy bliss.",
    "Cheese Tandoori Paneer Mayo": "The ultimate loaded patty — cheese, tandoori spice, paneer & creamy mayo, all in one.",
    "Cheese Tandoori Patties": "Flaky patties packed with melted cheese and fiery tandoori masala — spicy meets cheesy!",
    "Cheese Paneer Patties": "Double delight — flaky patties loaded with both melted cheese and spiced paneer.",
    "Cheese Tandoori Paneer Patties": "Triple treat patty with tandoori spice, paneer chunks and gooey melted cheese.",
    "Tandoori Paneer Patties": "Hot patties stuffed with tandoori-marinated paneer — smoky, spicy and satisfying.",
    "Tandoori Mayo Patties": "Tandoori-spiced patties finished with a drizzle of creamy mayonnaise — a flavour bomb!",
    "Cheese Tandoori Paneer Mayo Patties": "Our most loaded patty ever — cheese, tandoori, paneer & mayo all packed in one crispy shell.",
    "Mayonnaise Patties": "Light and creamy — flaky patties with a smooth mayonnaise filling, perfect as a quick snack.",

    // ─────────────── BURGERS ───────────────
    "Aloo Tikki Burger": "Crispy spiced potato tikki patty in a soft bun with fresh veggies and sauces — desi burger at its best!",
    "Veg Burger": "Classic veg patty burger with fresh lettuce, tomato, onion and our special sauce.",
    "Veg Paneer Burger": "Juicy burger with a thick paneer patty, fresh veggies and creamy sauces in a soft bun.",
    "Veg Cheese Burger": "Classic veg burger topped with a thick layer of hot, melted cheese — pure cheesy goodness.",
    "Tandoori Burger": "Smoky tandoori-spiced patty burger with onions, sauces and a kick of Indian spice.",
    "Schezwan Burger": "Fiery burger loaded with spicy Schezwan sauce — for those who love it hot!",
    "Makhani Burger": "Unique butter-makhani flavoured burger with a rich, creamy tomato-butter sauce.",
    "Makhani Paneer Burger": "Loaded makhani burger with a thick paneer patty and buttery tomato-cream sauce.",
    "Tandoori Paneer Burger": "Bold tandoori-spiced paneer patty burger — smoky, cheesy and packed with flavour.",
    "Chilly Burger": "Spicy chilli burger with hot peppers and fiery sauce — made for spice lovers!",
    "Mexican Burger": "Mexican-style burger with salsa, jalapeños, nachos, and melted cheese in every bite.",
    "SPB Special Burger": "Our signature house-special burger — triple-stacked, fully loaded with every topping. The BEST one we make!",

    // ─────────────── MAGGIE ───────────────
    "Plain Maggie": "Simple, piping hot Maggi noodles cooked to perfection — the ultimate comfort food.",
    "Veg Maggie": "Maggi noodles tossed with fresh carrots, peas, beans and capsicum — healthy and tasty.",
    "Paneer Maggie": "Spicy Maggi loaded with soft, chunky paneer cubes — extra protein, extra taste!",
    "Tandoori Maggie": "Maggi tossed in smoky, fiery tandoori masala — spicy red noodles with bold Indian flavour.",
    "Corn Cheese Maggie": "Sweet corn kernels and gooey melted cheese mixed into hot Maggi — sweet, cheesy, delicious!",
    "Cheese and Butter Maggie": "The ultimate indulgence — Maggi loaded with melted cheese and a generous pat of butter.",
    "Butter Maggie": "Classic Maggi topped with a big, melting pat of fresh butter — simple yet irresistible.",
    "Pizza Maggie": "Pizza-style Maggi topped with mozzarella cheese, oregano, capsicum and Italian herbs.",
    "Pizza Paneer Maggie": "Fusion Maggi with pizza seasonings, melted cheese AND chunky paneer — best of both worlds!",
    "Tandoori Paneer Maggie": "Spicy tandoori paneer cubes tossed with hot Maggi — double the flavour, double the fun!",

    // ─────────────── SANDWICHES ───────────────
    "Veg Sandwich": "Grilled sandwich packed with fresh cucumber, tomato, onion, capsicum & green chutney.",
    "Paneer Sandwich": "Toasted sandwich stuffed with seasoned, crumbled paneer and fresh veggies.",
    "Corn Mayo Sandwich": "Sweet corn and creamy mayonnaise grilled sandwich — light, creamy and satisfying.",
    "Tandoori Sandwich": "Spicy tandoori-marinated veggie sandwich, grilled to smoky perfection.",
    "Paneer Special Sandwich": "Premium sandwich loaded with extra paneer, special spices and our secret sauce.",
    "Sev Onion Sandwich": "Crunchy sev and spiced onions in a toasted sandwich — a chatpata desi treat!",
    "Tandoori Paneer Corn Sandwich": "Fully loaded with tandoori paneer, sweet corn, cheese and spices — our most filling sandwich!",
    "Pizza Sandwich": "Pizza-flavoured grilled sandwich with mozzarella, oregano, capsicum & pizza sauce.",

    // ─────────────── FRENCH FRIES ───────────────
    "Salt Fries": "Classic golden, crispy French fries with just the right amount of salt. Simple perfection.",
    "Masala Fries": "Crispy fries tossed in a special Indian spice blend — chatpata and addictive!",
    "Peri Peri Fries": "Crispy fries dusted with fiery peri-peri seasoning — hot, tangy and absolutely addictive!",
    "Cheese Loaded Fries": "Golden fries smothered in hot, gooey melted cheese — cheese lovers, this one's for you!",
    "Tandoori Fries": "Crispy fries coated in smoky tandoori seasoning with a dash of lime — uniquely delicious!",

    // ─────────────── WRAPS ───────────────
    "Veg Wrap": "Soft tortilla wrap filled with fresh veggies, sauces and crunchy goodness — light and healthy.",
    "Paneer Wrap": "Soft wrap stuffed with spiced paneer cubes, veggies and creamy sauces — filling and protein-packed.",
    "SPB Wrap": "Our signature special wrap — loaded with paneer, veggies, multiple sauces and extra cheese. The ultimate roll!",

    // ─────────────── PASTA ───────────────
    "Red Sauce Pasta": "Classic Italian-style pasta in a tangy, herbed tomato red sauce with fresh veggies.",
    "White Sauce Pasta": "Creamy white sauce (béchamel) pasta with a smooth, buttery, cheesy flavour.",
    "Pink Sauce Pasta": "The best of both worlds — a blend of tangy red tomato and creamy white sauce for a perfect pink pasta.",
    "Cheese Red Pasta": "Red sauce pasta topped with loads of melted mozzarella cheese — tangy, cheesy, heavenly!",
    "Tandoori Sauce Pasta": "Indo-Italian fusion — pasta tossed in a unique smoky tandoori sauce with Indian spices.",
    "Makhani Sauce Pasta": "Pasta in rich butter-tomato makhani sauce — like butter chicken gravy, but with pasta!",

    // ─────────────── CHINESE ───────────────
    "Chilly Paneer": "Crispy paneer cubes tossed in spicy Indo-Chinese chilli sauce with peppers and onions.",
    "Honey Chili Potato": "Crispy fried potato fingers glazed in sweet honey and spicy chilli sauce — sweet meets heat!",
    "Chili Garlic Noodles": "Stir-fried noodles tossed with loads of garlic and fiery green chillies — bold and aromatic.",
    "Veg Noodle": "Simple stir-fried noodles with fresh vegetables and light soy sauce — quick and satisfying.",
    "Garlic Chili Potato": "Crispy potato strips tossed in garlic and chilli sauce — garlicky, spicy, and crunchy!",
    "Chili Potato": "Classic crispy chili potato — golden fried potato strips tossed in hot chilli sauce. Everyone's favourite!",
    "Singapore Noodles": "Singapore-style stir-fried noodles with curry spices, veggies and bold Asian flavours.",
    "Hakka Noodles": "Classic Indo-Chinese Hakka noodles stir-fried with crunchy veggies and soy sauce — a street food legend!",

    // ─────────────── COFFEE & SHAKES ───────────────
    "Vanilla Shake": "Smooth and creamy classic vanilla milkshake — refreshing and timeless.",
    "Oreo Shake": "Thick, creamy milkshake blended with crushed Oreo cookies — cookies & cream heaven!",
    "Cold Coffee": "Classic chilled coffee blended smooth — refreshing, energizing, and perfect for any time.",
    "Kitkat Shake": "Rich milkshake blended with real KitKat bars — chocolatey, crunchy, and absolutely indulgent!",
    "Blueberry Shake": "Fruity blueberry milkshake with a vibrant berry flavour — refreshing and tangy-sweet.",
    "Cold Coffee with Ice Cream": "Premium cold coffee topped with a scoop of vanilla ice cream — extra creamy and indulgent!",
    "Strawberry Shake": "Sweet, creamy strawberry milkshake with a beautiful pink colour — fruity and refreshing!",
    "Butterscotch Shake": "Rich butterscotch flavoured shake with caramel sweetness — smooth and delightful.",
    "Pineapple Shake": "Tropical pineapple milkshake — tangy, sweet and incredibly refreshing on a hot day!",
    "Rajbhog Shake": "Royal Indian-flavoured shake inspired by the classic Rajbhog sweet — saffron, cardamom & nuts.",
    "American Nuts Shake": "Premium nutty milkshake loaded with almonds, cashews and walnuts — rich, thick and protein-packed!",
    "Kesar Pista Shake": "Royal saffron and pistachio milkshake — aromatic, nutty and fit for a king!",
    "Rose Milk Shake": "Fragrant rose-flavoured milkshake — floral, refreshing and beautifully pink.",
    "Pan Shake": "Unique betel leaf (paan) flavoured shake — fresh, minty and a true Banarasi twist!",
    "Black Current Shake": "Rich blackcurrant berry milkshake — deep, fruity flavour with a beautiful purple colour.",
    "Anzeer Shake": "Luxurious fig (anjeer) milkshake — naturally sweet, healthy and incredibly rich in flavour.",
    "Papaya Shake": "Fresh papaya milkshake — naturally sweet, healthy and loaded with vitamins. Light and refreshing!",
    "Mango Shake": "Classic mango milkshake — thick, sweet and bursting with the king of fruits' flavour!",
    "Chocolate Shake": "Thick, rich chocolate milkshake — a chocolatey dream in every sip!",

    // ─────────────── MOJITOS ───────────────
    "Classic Mojito": "Refreshing classic mojito with fresh lime, mint and soda — cool and invigorating!",
    "Black Cobra": "Mysterious dark-flavoured cooler with a bold, unique berry-charcoal twist — daring and refreshing!",
    "Blue Ocean": "Vibrant blue curacao-flavoured cooler — tropical, sweet and visually stunning!",
    "Virgin Mojito": "Classic non-alcoholic mojito with fresh mint, lime juice and soda — an all-time favourite cooler!",
    "Apple Peach Mojito": "Fruity fusion mojito with apple and peach flavours, mint and soda — sweet and refreshing!",
    "Watermelon Mojito": "Fresh watermelon mojito — the perfect summer cooler with sweet melon, mint and lime.",
    "Blackcurrant Mojito": "Bold blackcurrant berry mojito with a beautiful purple hue — tangy, fruity and refreshing!",
    "Strawberry Mojito": "Sweet strawberry mojito with fresh mint and lime — pink, pretty and perfectly refreshing!",

    // ─────────────── PIZZAS ───────────────
    "OTC Pizza": "Classic Onion-Tomato-Capsicum pizza with mozzarella cheese — simple, fresh and delicious.",
    "Sweet Corn Pizza": "Sweet corn and cheese pizza — mild, sweet flavour that kids and adults both love!",
    "Paneer Pizza": "Loaded with chunky paneer cubes and mozzarella cheese on a crispy base — an Indian favourite!",
    "Double Cheese Pizza": "Double the cheese, double the love! Extra thick mozzarella on every slice — cheesy paradise!",
    "Extra Cheese Loaded Pizza": "Mountains of melted cheese on top of veggies — our cheesiest pizza ever! For serious cheese fans only.",
    "Tandoori Paneer Pizza": "Spicy tandoori-marinated paneer on a cheesy pizza base — the perfect Indo-Italian fusion!",
    "Four In One Pizza": "Four different toppings in four quarters — try multiple flavours in a single pizza!",
    "Golden Baby Pizza": "Premium golden-crust pizza with a rich cheese blend and special toppings — our chef's pride!",
    "Makhani Pizza": "Unique makhani (butter-tomato) sauce base pizza with cheese — Indian butter gravy meets Italian pizza!",
    "Makhani Paneer Pizza": "Makhani sauce base loaded with paneer chunks and cheese — the ultimate desi pizza experience!",
    "Tandoori Pizza": "Smoky tandoori-sauce pizza with onions, capsicum and Indian spices — bold and flavourful!",
    "SPB Special Pizza": "Our SIGNATURE pizza — loaded with every premium topping, extra cheese and our secret sauce. The house favourite!",

    // ─────────────── PLACEHOLDER ───────────────
    "Yes": "Special item — please ask our staff for details."
};

async function addDescriptions() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected\n');

        const products = await Product.find({});
        let updated = 0;
        let notFound = 0;

        for (const product of products) {
            // Try exact name match first, then trimmed name match
            let desc = DESCRIPTIONS[product.name];
            if (!desc) {
                desc = DESCRIPTIONS[product.name.trim()]; 
            }

            if (desc) {
                product.description = desc;
                await product.save();
                updated++;
                console.log('OK:', product.name.trim());
            } else {
                console.log('MISSING:', '[' + product.name + ']');
                notFound++;
            }
        }

        console.log('\n' + '='.repeat(40));
        console.log('Updated:', updated);
        console.log('Missing:', notFound);
        console.log('Total:', products.length);
        console.log('='.repeat(40));

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

addDescriptions();
