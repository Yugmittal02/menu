const m=require('mongoose'),d=require('dotenv'),p=require('path');
d.config({path:p.join(__dirname,'..', '.env')});
const P=require('../models/Product');
(async()=>{
    await m.connect(process.env.MONGODB_URI);
    const noImg=await P.find({$or:[{image:null},{image:''},{image:{$exists:false}}]},'name subcategories');
    console.log('Products WITHOUT images:', noImg.length);
    noImg.forEach(x=>console.log(' -', x.name, '('+x.subcategories+')'));
    process.exit(0);
})();
