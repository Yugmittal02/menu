import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPublicCafe, getPublicMenu, placeOrder, validateCoupon } from '../services/api';
import { useCart } from '../context/CartContext';
import { FiMinus, FiPlus, FiShoppingCart, FiX, FiClock, FiPhone, FiMapPin, FiSend, FiTag, FiSearch } from 'react-icons/fi';
import { themes } from '../utils/themes';

const CROSS_SELL = {
  'Burgers':['Drinks','Shakes','Beverages'],'Momos':['Drinks','Beverages'],'Pizza':['Drinks','Beverages'],
  'Sandwich':['Drinks','Beverages'],'Rolls':['Drinks','Beverages'],'Noodles':['Drinks','Beverages'],
  'Drinks':['Burgers','Momos','Snacks'],'Beverages':['Burgers','Momos','Snacks'],
};

const CAT_EMOJI = {
  'All':'🍽️','Burgers':'🍔','Momos':'🥟','Pizza':'🍕','Sandwich':'🥪','Rolls':'🌯',
  'Noodles':'🍜','Rice':'🍚','Drinks':'🥤','Beverages':'☕','Shakes':'🥛','Desserts':'🍰',
  'Snacks':'🍟','Soups':'🍲','Salads':'🥗','Ice Cream':'🍦','Fries':'🍟','Combos':'🎁',
  'Add-ons':'➕','Extras':'➕','Utilities':'🧻','Thali':'🍛','Biryani':'🍛','Chinese':'🥡',
  'South Indian':'🫓','Pasta':'🍝','Wraps':'🌮','Sides':'🧆','Bread':'🫓','Other':'🍽️',
};

const BANNERS = [
  { text:'🔥 Try Our Bestsellers!', sub:'Most loved by customers', bg:'linear-gradient(135deg,#F43F5E,#E11D48)' },
  { text:'🎉 Apply Coupon at Checkout', sub:'Save more on your order', bg:'linear-gradient(135deg,#7C3AED,#6D28D9)' },
  { text:'⚡ Fresh & Fast', sub:'Prepared with love, served quick', bg:'linear-gradient(135deg,#F59E0B,#D97706)' },
];

const getSavedCustomer = () => { try { return JSON.parse(localStorage.getItem('qr_customer')||'{}'); } catch { return {}; } };

const CustomerMenu = () => {
  const { cafeId, tableNo } = useParams();
  const navigate = useNavigate();
  const { cart, subtotal, discount, total, coupon, initCart, addToCart, updateQuantity, clearCart, getItemCount, applyCoupon, removeCoupon } = useCart();
  const [cafe, setCafe] = useState(null);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [vegOnly, setVegOnly] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showOrder, setShowOrder] = useState(false);
  const [customerName, setCustomerName] = useState(getSavedCustomer().name || '');
  const [customerPhone, setCustomerPhone] = useState(getSavedCustomer().phone || '');
  const [lastOrder, setLastOrder] = useState(null);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [placing, setPlacing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [bannerIdx, setBannerIdx] = useState(0);
  const initDone = useRef(false);

  const activeTheme = cafe ? (themes[cafe.theme] || themes['classic-dark']) : themes['classic-dark'];

  useEffect(() => {
    if (!initDone.current) { initCart(cafeId); initDone.current = true; }
    // Load last order for reorder feature
    try { const lo = JSON.parse(localStorage.getItem(`qr_lastorder_${cafeId}`)||'null'); setLastOrder(lo); } catch{}
    const loadData = async () => {
      try {
        const [cafeRes, menuRes] = await Promise.all([getPublicCafe(cafeId), getPublicMenu(cafeId)]);
        setCafe(cafeRes.data);
        setMenu(menuRes.data.filter(i => i.isAvailable !== false));
      } catch (e) { setError('Cafe not found or inactive'); }
      setLoading(false);
    };
    loadData();
    // Auto-refresh menu every 30s to pick up new items without losing cart
    const interval = setInterval(async () => {
      try {
        const menuRes = await getPublicMenu(cafeId);
        setMenu(menuRes.data.filter(i => i.isAvailable !== false));
      } catch(e){}
    }, 30000);
    return () => clearInterval(interval);
  }, [cafeId]);

  // Banner rotation
  useEffect(() => { const t = setInterval(() => setBannerIdx(i => (i+1)%BANNERS.length), 4000); return () => clearInterval(t); }, []);

  const categories = ['All', ...new Set(menu.map(i => i.category))];
  const filteredMenu = menu.filter(item => {
    if (activeCategory !== 'All' && item.category !== activeCategory) return false;
    if (vegOnly && !item.isVeg) return false;
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getCartQty = (id) => { const item = cart.find(i => i.menuItemId === id); return item ? item.quantity : 0; };
  const handleAddToCart = (item) => { addToCart({ menuItemId: item._id, name: item.name, price: item.price, image: item.image, category: item.category }); };

  const getCrossSellItems = () => {
    if (cart.length === 0) return [];
    const cartCats = [...new Set(cart.map(c => c.category).filter(Boolean))];
    const suggestCats = new Set();
    cartCats.forEach(cat => { (CROSS_SELL[cat] || []).forEach(s => suggestCats.add(s)); });
    cartCats.forEach(c => suggestCats.delete(c));
    return menu.filter(item => suggestCats.has(item.category) && !cart.find(c => c.menuItemId === item._id)).slice(0, 4);
  };

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true); setCouponError('');
    try {
      const { data } = await validateCoupon({ code: couponInput.trim(), cafeId, orderTotal: subtotal });
      applyCoupon(data); setCouponError('');
    } catch (e) { setCouponError(e.response?.data?.message || 'Invalid coupon'); removeCoupon(); }
    setCouponLoading(false);
  };

  const handlePlaceOrder = async () => {
    if (!customerName.trim()) { alert('Please enter your name'); return; }
    if (cart.length === 0) { alert('Cart is empty'); return; }
    setPlacing(true);
    try {
      const orderItems = cart.map(i => ({ menuItem: i.menuItemId, name: i.name, price: i.price, quantity: i.quantity, image: i.image }));
      const { data } = await placeOrder({
        cafeId, tableNumber: parseInt(tableNo), customerName: customerName.trim(), customerPhone,
        items: orderItems, specialInstructions, couponCode: coupon?.code || ''
      });
      // Save customer info & last order for next visit
      localStorage.setItem('qr_customer', JSON.stringify({ name: customerName.trim(), phone: customerPhone }));
      localStorage.setItem(`qr_lastorder_${cafeId}`, JSON.stringify(orderItems.slice(0, 5)));
      clearCart(); setShowCart(false); setShowOrder(false);
      navigate(`/order/track/${data.order.orderNumber}`);
    } catch (e) { alert(e.response?.data?.message || 'Order failed'); }
    setPlacing(false);
  };

  const handleReorder = () => {
    if (!lastOrder) return;
    lastOrder.forEach(item => { addToCart({ menuItemId: item.menuItem, name: item.name, price: item.price, image: item.image, category: '' }); });
    setLastOrder(null);
  };

  if (loading) return (
    <div className="min-h-screen" style={{background:'#0B0B14'}}>
      <div className="p-4 space-y-3">
        <div className="skeleton h-36 w-full rounded-2xl" />
        <div className="skeleton h-10 w-full rounded-xl" />
        <div className="flex gap-2">{[1,2,3,4].map(i=><div key={i} className="skeleton h-8 w-20 rounded-full"/>)}</div>
        {[1,2,3].map(i=><div key={i} className="skeleton h-28 rounded-2xl"/>)}
      </div>
    </div>
  );
  if (error) return <div className="min-h-screen flex items-center justify-center" style={{background:'#0B0B14'}}><div className="text-center"><p className="text-5xl mb-3">😔</p><p className="text-red-400 text-lg">{error}</p></div></div>;

  const crossSellItems = getCrossSellItems();
  const banner = BANNERS[bannerIdx];

  return (
    <div className="min-h-screen pb-28 font-sans" style={{background: activeTheme.background}}>
      {/* PREMIUM HERO BANNER */}
      <div className="relative overflow-hidden rounded-b-[2.5rem] shadow-2xl" style={{height:'240px'}}>
        <div className="absolute inset-0" style={{background:`linear-gradient(135deg, ${activeTheme.cardBg}, ${activeTheme.background})`}} />
        <div className="absolute inset-0 opacity-40" style={{background:`radial-gradient(circle at 0% 0%, ${activeTheme.primary} 0%, transparent 50%), radial-gradient(circle at 100% 100%, ${activeTheme.primaryDark} 0%, transparent 50%)`}} />
        <div className="absolute inset-0" style={{backgroundImage:`url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3z' fill='%23ffffff' fill-opacity='0.03' fill-rule='evenodd'/%3E%3C/svg%3E")`}} />
        {/* Decorative elements */}
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full blur-3xl opacity-40" style={{background:activeTheme.primary}} />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full blur-3xl opacity-40" style={{background:activeTheme.primaryDark}} />
        
        {/* Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 pt-4 pb-8 z-10">
          <div className="w-16 h-16 rounded-2xl mb-3 flex items-center justify-center text-3xl shadow-xl" style={{background:`linear-gradient(135deg, ${activeTheme.primary}, ${activeTheme.primaryDark})`, border:'2px solid rgba(255,255,255,0.15)'}}>
            {cafe?.name?.charAt(0) || '☕'}
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight" style={{textShadow:'0 4px 15px rgba(0,0,0,0.5)'}}>{cafe?.name}</h1>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-3 text-white/90 text-xs font-medium">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-sm" style={{background:'rgba(255,255,255,0.15)', backdropFilter:'blur(8px)'}}><FiMapPin size={12}/>{cafe?.address||cafe?.city||'Restaurant'}</span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-sm" style={{background:'rgba(255,255,255,0.15)', backdropFilter:'blur(8px)'}}><FiClock size={12}/>{cafe?.openTime}-{cafe?.closeTime}</span>
          </div>
        </div>
      </div>

      {/* TABLE BADGE OVERLAP */}
      <div className="flex justify-center -mt-6 relative z-20 mb-6">
        <div className="px-8 py-3 rounded-2xl shadow-xl backdrop-blur-md flex items-center gap-3" style={{background:`linear-gradient(135deg, ${activeTheme.primary}, ${activeTheme.primaryDark})`, border:`2px solid ${activeTheme.background}`}}>
          <span className="text-2xl drop-shadow-md">🪑</span>
          <span className="text-white font-black tracking-widest text-sm uppercase">Table {tableNo}</span>
        </div>
      </div>

      {/* ADD-ONS / UTILITIES STRIP */}
      {menu.filter(i=>['Add-ons','Extras','Utilities','Add Ons'].includes(i.category)).length > 0 && (
        <div className="px-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] uppercase tracking-widest font-bold" style={{color:activeTheme.textSecondary}}>⚡ Quick Essentials</p>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2" style={{scrollbarWidth:'none'}}>
            {menu.filter(i=>['Add-ons','Extras','Utilities','Add Ons'].includes(i.category)).map(item => {
              const qty = getCartQty(item._id);
              return (
                <div key={item._id} className="flex-shrink-0 flex items-center gap-3 px-4 py-2.5 rounded-2xl shadow-sm relative overflow-hidden" style={{background:activeTheme.glassBg, border:`1px solid ${activeTheme.primary}20`}}>
                  <div className="absolute inset-0 opacity-10" style={{background:activeTheme.primary}} />
                  <span className="text-lg z-10">{item.name.includes('Tissue')?'🧻':item.name.includes('Sauce')||item.name.includes('sauce')?'🫙':item.name.includes('Spoon')||item.name.includes('Fork')?'🍴':item.name.includes('Water')?'💧':'➕'}</span>
                  <div className="z-10 pr-2">
                    <p className="text-xs font-bold whitespace-nowrap" style={{color:activeTheme.textPrimary}}>{item.name}</p>
                    <p className="text-[10px] font-medium" style={{color:activeTheme.primary}}>₹{item.price}</p>
                  </div>
                  <div className="z-10">
                    {qty===0 ? (
                      <button onClick={()=>handleAddToCart(item)} className="text-[10px] px-3 py-1.5 rounded-xl font-bold transition-transform active:scale-90" style={{background:activeTheme.primary,color:'#fff',boxShadow:`0 2px 8px ${activeTheme.primary}40`}}>ADD</button>
                    ) : (
                      <span className="text-xs font-black px-3 py-1 rounded-xl bg-green-500/20 text-green-500 border border-green-500/30">✓ {qty}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ROTATING PROMO BANNER */}
      <div className="px-4 mb-6">
        <div className="rounded-3xl p-5 transition-all duration-500 flex items-center gap-4 shadow-xl relative overflow-hidden" style={{background:banner.bg}}>
          <div className="absolute right-0 bottom-0 w-40 h-40 rounded-full blur-2xl opacity-30 bg-white translate-x-1/2 translate-y-1/2" />
          <div className="flex-1 z-10">
            <p className="text-white font-black text-xl tracking-tight mb-1" style={{textShadow:'0 2px 4px rgba(0,0,0,0.2)'}}>{banner.text}</p>
            <p className="text-white/90 text-sm font-medium">{banner.sub}</p>
          </div>
          <div className="flex gap-1.5 z-10">{BANNERS.map((_,i)=><div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i===bannerIdx?'w-5 bg-white':'w-2 bg-white/40'}`}/>)}</div>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="px-4 mb-6">
        <div className="relative shadow-lg rounded-2xl">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2" style={{color:activeTheme.primary}} size={18}/>
          <input type="text" placeholder="What are you craving today?" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} className="w-full py-4 pl-12 pr-4 rounded-2xl text-sm outline-none font-medium transition-all" style={{background:activeTheme.glassBg, border:`1px solid ${activeTheme.primary}30`, color:activeTheme.textPrimary, boxShadow:`inset 0 2px 10px rgba(0,0,0,0.1), 0 4px 20px ${activeTheme.primary}10`}} />
        </div>
      </div>

      {/* REORDER BANNER */}
      {lastOrder && lastOrder.length > 0 && !searchQuery && (
        <div className="px-4 mb-6">
          <div className="rounded-3xl p-4 flex items-center gap-4 relative overflow-hidden shadow-lg" style={{background:'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))', border:'1px solid rgba(245,158,11,0.3)'}}>
            <div className="absolute right-0 top-0 w-40 h-40 rounded-full blur-3xl opacity-20 bg-yellow-500 translate-x-1/2 -translate-y-1/2" />
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl bg-yellow-500/20 shadow-inner z-10 border border-yellow-500/30">🔄</div>
            <div className="flex-1 z-10">
              <p className="text-lg font-black tracking-tight" style={{color:'#F59E0B'}}>Order your usual?</p>
              <p className="text-xs font-medium mt-1 line-clamp-1" style={{color:activeTheme.textSecondary}}>{lastOrder.map(i=>i.name).join(', ')}</p>
            </div>
            <button onClick={handleReorder} className="text-sm px-6 py-3 rounded-xl font-black shadow-xl z-10 active:scale-95 transition-transform" style={{background:'#F59E0B',color:'#000'}}>ADD ALL</button>
          </div>
        </div>
      )}

      {/* CATEGORY FILTERS */}
      <div className="pl-4 mb-6">
        <div className="flex items-center gap-3 overflow-x-auto pb-3 pr-4" style={{scrollbarWidth:'none'}}>
          <button onClick={()=>setVegOnly(!vegOnly)} className="flex items-center gap-2 px-5 py-3 rounded-full text-sm font-bold whitespace-nowrap transition-all flex-shrink-0 border"
            style={vegOnly
              ? {background:'rgba(16,185,129,0.15)', color:'#10B981', borderColor:'#10B981', boxShadow:`0 4px 15px rgba(16,185,129,0.25)`}
              : {background:activeTheme.glassBg, color:activeTheme.textSecondary, borderColor:`${activeTheme.primary}20`}}>
            <span className="text-lg" style={{filter:vegOnly?'drop-shadow(0 2px 4px rgba(16,185,129,0.4))':'none'}}>🟢</span><span>Veg Only</span>
          </button>
          {categories.map(cat=>(
            <button key={cat} onClick={()=>setActiveCategory(cat)} className="flex items-center gap-2 px-5 py-3 rounded-full text-sm font-bold whitespace-nowrap transition-all flex-shrink-0 border"
              style={activeCategory===cat
                ? {background:activeTheme.primary, color:'#fff', borderColor:activeTheme.primary, boxShadow:`0 6px 20px ${activeTheme.primary}60`}
                : {background:activeTheme.glassBg, color:activeTheme.textSecondary, borderColor:`${activeTheme.primary}20`}}>
              <span className="text-lg" style={{filter: activeCategory===cat ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' : 'none'}}>{CAT_EMOJI[cat]||'🍽️'}</span>
              <span>{cat}</span>
            </button>
          ))}
        </div>
      </div>

      {/* MENU ITEMS GRID */}
      <div className="px-4 space-y-5">
        {filteredMenu.length===0 ? (
          <div className="text-center py-16"><div className="text-6xl mb-4 opacity-30" style={{filter:'grayscale(1)'}}>🍽️</div><p className="text-lg font-medium" style={{color:activeTheme.textSecondary}}>No items found</p></div>
        ) : filteredMenu.map(item => {
          const qty = getCartQty(item._id);
          return (
            <div key={item._id} className="relative rounded-3xl p-4 flex gap-4 transition-all overflow-hidden" style={{background:activeTheme.glassBg, border:`1px solid ${activeTheme.primary}20`, boxShadow:`0 8px 30px rgba(0,0,0,0.15)`}}>
              {/* Subtle background glow */}
              <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl opacity-10" style={{background:activeTheme.primary}} />
              
              <div className="flex-1 min-w-0 z-10 py-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-4 h-4 rounded-sm flex items-center justify-center text-[10px] border shadow-sm ${item.isVeg?'border-green-500 text-green-500 bg-green-500/10':'border-red-500 text-red-500 bg-red-500/10'}`}>{item.isVeg?'●':'▲'}</span>
                  {item.category && !['Add-ons','Extras','Utilities'].includes(item.category) && (
                    <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full" style={{background:`${activeTheme.primary}20`, color:activeTheme.primary}}>{item.category}</span>
                  )}
                </div>
                <h3 className="font-black text-lg leading-tight mb-1.5 tracking-tight" style={{color:activeTheme.textPrimary}}>{item.name}</h3>
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="font-extrabold text-base" style={{color:activeTheme.textPrimary}}>₹{item.price}</span>
                  {item.preparationTime>0 && <span className="text-[10px] flex items-center gap-1 font-medium px-2 py-0.5 rounded-md" style={{background:'rgba(255,255,255,0.06)', color:activeTheme.textSecondary}}><FiClock size={10}/>{item.preparationTime}m</span>}
                </div>
                {item.description && <p className="text-xs line-clamp-2" style={{color:activeTheme.textSecondary, lineHeight:'1.6'}}>{item.description}</p>}
              </div>
              
              <div className="relative flex flex-col items-center flex-shrink-0 z-10 w-28 pb-4">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-28 h-28 rounded-2xl object-cover shadow-xl" style={{border:`1px solid ${activeTheme.primary}30`}}/>
                ) : (
                  <div className="w-28 h-28 rounded-2xl flex items-center justify-center text-5xl shadow-xl relative overflow-hidden" style={{background:`linear-gradient(135deg, ${activeTheme.primary}30, ${activeTheme.primary}10)`, border:`1px solid ${activeTheme.primary}20`}}>
                    <div className="absolute inset-0 opacity-20" style={{backgroundImage:'radial-gradient(circle at center, #fff 1px, transparent 1px)', backgroundSize:'12px 12px'}} />
                    <span style={{filter:`drop-shadow(0 8px 16px rgba(0,0,0,0.4))`}}>{CAT_EMOJI[item.category] || '🍽️'}</span>
                  </div>
                )}
                
                <div className="absolute -bottom-1 w-full flex justify-center">
                  {qty===0 ? (
                    <button onClick={()=>handleAddToCart(item)} className="text-sm py-2 px-7 rounded-xl font-black transition-transform active:scale-95 text-white" style={{background:activeTheme.primary, boxShadow:`0 6px 20px ${activeTheme.primary}60`, border:`2px solid ${activeTheme.cardBg}`}}>ADD</button>
                  ) : (
                    <div className="flex items-center justify-between w-[90%] rounded-xl px-1.5 py-1.5 shadow-xl text-white" style={{background:activeTheme.primary, boxShadow:`0 6px 20px ${activeTheme.primary}60`, border:`2px solid ${activeTheme.cardBg}`}}>
                      <button onClick={()=>updateQuantity(item._id,-1)} className="w-7 h-7 rounded-lg flex items-center justify-center active:scale-90 bg-white/20 hover:bg-white/30 transition-colors"><FiMinus size={16}/></button>
                      <span className="font-black text-sm">{qty}</span>
                      <button onClick={()=>updateQuantity(item._id,1)} className="w-7 h-7 rounded-lg flex items-center justify-center active:scale-90 bg-white/20 hover:bg-white/30 transition-colors"><FiPlus size={16}/></button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Cart */}
      {getItemCount()>0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 z-50">
          <button onClick={()=>setShowCart(true)} className="w-full py-4 px-6 rounded-2xl flex items-center justify-between" style={{background:`linear-gradient(135deg,${activeTheme.primary},${activeTheme.primaryDark})`,boxShadow:`0 -4px 30px ${activeTheme.primaryLight}`}}>
            <div className="flex items-center gap-3">
              <div className="relative"><FiShoppingCart className="text-white text-xl"/><span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#F43F5E] text-white text-[10px] flex items-center justify-center font-bold">{getItemCount()}</span></div>
              <span className="text-white font-medium">{getItemCount()} items</span>
            </div>
            <span className="text-white font-bold text-lg">₹{total} →</span>
          </button>
        </div>
      )}

      {/* Cart Drawer */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={()=>setShowCart(false)}>
          <div className="absolute inset-0 bg-black/60"/>
          <div className="relative w-full max-h-[90vh] rounded-t-3xl overflow-y-auto slide-up" style={{background:activeTheme.cardBg}} onClick={e=>e.stopPropagation()}>
            <div className="sticky top-0 flex items-center justify-between p-4 border-b z-10" style={{background:activeTheme.cardBg,borderColor:`${activeTheme.primary}20`}}>
              <h2 className="text-lg font-bold" style={{color:activeTheme.textPrimary}}>Your Order</h2>
              <button onClick={()=>setShowCart(false)} style={{color:activeTheme.textSecondary}}><FiX size={22}/></button>
            </div>
            <div className="p-4 space-y-2">
              {cart.map(item=>(
                <div key={item.menuItemId} className="flex items-center gap-3 p-3 rounded-xl" style={{background:activeTheme.glassBg}}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{color:activeTheme.textPrimary}}>{item.name}</p>
                    <p className="text-sm font-bold" style={{color:activeTheme.primary}}>₹{item.price*item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={()=>updateQuantity(item.menuItemId,-1)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{background:'rgba(244,63,94,0.12)',color:'#F43F5E'}}><FiMinus size={14}/></button>
                    <span className="font-bold text-sm w-4 text-center" style={{color:activeTheme.textPrimary}}>{item.quantity}</span>
                    <button onClick={()=>updateQuantity(item.menuItemId,1)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{background:'rgba(16,185,129,0.12)',color:'#10B981'}}><FiPlus size={14}/></button>
                  </div>
                </div>
              ))}
            </div>
            {/* Cross-sell */}
            {crossSellItems.length>0 && (
              <div className="px-4 pb-3">
                <p className="text-xs font-medium mb-2" style={{color:activeTheme.textSecondary}}>✨ You might also like</p>
                <div className="flex gap-2 overflow-x-auto" style={{scrollbarWidth:'none'}}>
                  {crossSellItems.map(item=>(
                    <div key={item._id} className="flex-shrink-0 w-28 rounded-xl p-2 text-center" style={{background:activeTheme.glassBg,border:`1px solid ${activeTheme.primary}10`}}>
                      {item.image?<img src={item.image} alt="" className="w-full h-14 rounded-lg object-cover mb-1"/>:<div className="w-full h-14 rounded-lg mb-1 flex items-center justify-center" style={{background:activeTheme.primaryLight}}>🍽️</div>}
                      <p className="text-[10px] truncate" style={{color:activeTheme.textPrimary}}>{item.name}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] font-bold" style={{color:activeTheme.primary}}>₹{item.price}</span>
                        <button onClick={()=>handleAddToCart(item)} className="text-[9px] px-2 py-0.5 rounded-md font-bold" style={{background:activeTheme.primary,color:'#fff'}}>+ADD</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Coupon */}
            <div className="px-4 pb-3">
              <div className="rounded-xl p-3" style={{background:activeTheme.glassBg,border:`1px solid ${activeTheme.primary}10`}}>
                <p className="text-xs font-medium mb-2 flex items-center gap-1" style={{color:activeTheme.textSecondary}}><FiTag size={12}/>Have a coupon?</p>
                {coupon ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{background:`${activeTheme.primary}20`,color:activeTheme.primary}}>{coupon.code}</span>
                      <span className="text-xs" style={{color:'#10B981'}}>-₹{discount} off!</span>
                    </div>
                    <button onClick={()=>{removeCoupon();setCouponInput('');setCouponError('');}} className="text-xs" style={{color:'#F43F5E'}}>Remove</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input placeholder="Enter code" value={couponInput} onChange={e=>setCouponInput(e.target.value.toUpperCase())} className="flex-1 py-1.5 px-3 rounded-lg text-xs outline-none" style={{background:'rgba(255,255,255,0.03)',border:`1px solid ${activeTheme.primary}20`,color:activeTheme.textPrimary}}/>
                    <button onClick={handleApplyCoupon} disabled={couponLoading} className="text-xs px-3 py-1.5 rounded-lg font-bold" style={{background:activeTheme.primary,color:'#fff'}}>{couponLoading?'...':'Apply'}</button>
                  </div>
                )}
                {couponError && <p className="text-[10px] mt-1" style={{color:'#F43F5E'}}>{couponError}</p>}
              </div>
            </div>
            {/* Totals */}
            <div className="p-4 border-t" style={{borderColor:`${activeTheme.primary}15`}}>
              <div className="space-y-1 mb-3">
                <div className="flex justify-between text-sm" style={{color:activeTheme.textSecondary}}><span>Subtotal</span><span>₹{subtotal}</span></div>
                {discount>0 && <div className="flex justify-between text-sm" style={{color:'#10B981'}}><span>Discount ({coupon?.code})</span><span>-₹{discount}</span></div>}
                <div className="flex justify-between font-bold text-lg pt-1" style={{color:activeTheme.textPrimary,borderTop:`1px solid ${activeTheme.primary}10`}}><span>Total</span><span>₹{total}</span></div>
              </div>
              {!showOrder ? (
                <button onClick={()=>setShowOrder(true)} className="w-full text-lg py-3 rounded-xl font-bold flex items-center justify-center gap-2" style={{background:`linear-gradient(135deg,${activeTheme.primary},${activeTheme.primaryDark})`,color:'#fff'}}><FiSend/> Place Order</button>
              ) : (
                <div className="space-y-3 slide-up">
                  <input placeholder="Your Name *" className="w-full py-2.5 px-3 rounded-xl text-sm outline-none" style={{background:'rgba(255,255,255,0.03)',border:`1px solid ${activeTheme.primary}20`,color:activeTheme.textPrimary}} required value={customerName} onChange={e=>setCustomerName(e.target.value)}/>
                  <input placeholder="Phone (optional)" className="w-full py-2.5 px-3 rounded-xl text-sm outline-none" style={{background:'rgba(255,255,255,0.03)',border:`1px solid ${activeTheme.primary}20`,color:activeTheme.textPrimary}} value={customerPhone} onChange={e=>setCustomerPhone(e.target.value)}/>
                  <textarea placeholder="Special instructions..." className="w-full py-2.5 px-3 rounded-xl text-sm outline-none resize-none" style={{background:'rgba(255,255,255,0.03)',border:`1px solid ${activeTheme.primary}20`,color:activeTheme.textPrimary}} rows="2" value={specialInstructions} onChange={e=>setSpecialInstructions(e.target.value)}/>
                  <button onClick={handlePlaceOrder} disabled={placing||!customerName.trim()} className="w-full text-lg py-3 rounded-xl font-bold" style={{background:`linear-gradient(135deg,${activeTheme.primary},${activeTheme.primaryDark})`,color:'#fff',opacity:placing?0.6:1}}>
                    {placing?'⏳ Placing...':'✅ Confirm • ₹'+total}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerMenu;
