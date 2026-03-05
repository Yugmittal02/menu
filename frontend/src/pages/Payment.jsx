import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import {
  createOrder,
  registerCustomer,
  getFeeSettings,
  calculateDeliveryFee,
  getPaymentStatus,
  logUserActivity,
  getRazorpayKey,
} from "../services/api";
import {
  FaArrowLeft,
  FaMoneyBillWave,
  FaCreditCard,
  FaCheckCircle,
  FaMapMarkerAlt,
  FaTruck,
  FaGift,
} from "react-icons/fa";
import UPIPaymentModal from "../components/UPIPaymentModal";
import Footer from "../components/Footer";

const Payment = () => {
  const { cart, total, clearCart } = useCart();
  const { customer, enterAsCustomer } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if not logged in
  useEffect(() => {
    if (!customer) {
      navigate('/login', { state: { from: '/cart' } });
    }
  }, [customer, navigate]);

  // Get data passed from Cart page - default to Takeaway if not provided
  const passedOrderType = location.state?.orderType;
  const orderType = passedOrderType || "Takeaway";
  const deliveryAddress = location.state?.deliveryAddress || null;

  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Razorpay");
  const [showUPIModal, setShowUPIModal] = useState(false);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [checkingPendingPayment, setCheckingPendingPayment] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false); // Show loader while redirecting
  const isProcessingRef = useRef(false); // Ref for immediate check

  // Fee settings & delivery state
  const [feeSettings, setFeeSettings] = useState({ freeDeliveryThreshold: 500, deliveryFeeBase: 30 });
  const [freeDelivery, setFreeDelivery] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(orderType === "Delivery" ? 30 : 0);

  // Razorpay mode indicator
  const [razorpayMode, setRazorpayMode] = useState(null);

  useEffect(() => {
    const checkMode = async () => {
      try {
        const { data } = await getRazorpayKey();
        setRazorpayMode(data.mode);
      } catch (err) {
        // ignore
      }
    };
    checkMode();
  }, []);

  // Calculations - No tax, no platform fee
  const subtotal = Number(total) || 0;
  const grandTotal = Math.max(0, subtotal + deliveryFee);

  // Check for pending payment on page load (for UPI app return)
  useEffect(() => {
    const checkPendingPayment = async () => {
      const pendingOrderId = sessionStorage.getItem("pending_order_id");
      if (pendingOrderId) {
        // Close modal and show loading immediately
        setShowUPIModal(false);
        setCheckingPendingPayment(true);

        try {
          console.log("Checking pending payment for order:", pendingOrderId);

          // Poll a few times in case payment is processing
          let attempts = 0;
          const maxAttempts = 5;
          const pollInterval = 2000; // 2 seconds

          const pollPaymentStatus = async () => {
            attempts++;
            const { data } = await getPaymentStatus(pendingOrderId);

            if (data.paymentStatus === "Paid") {
              console.log("Payment confirmed! Redirecting to order success...");
              // Payment was successful
              sessionStorage.removeItem("pending_order_id");
              sessionStorage.setItem("payment_success", Date.now().toString());
              isProcessingRef.current = true;
              setIsProcessingOrder(true);
              setCheckingPendingPayment(false);
              setIsRedirecting(true); // Show redirecting loader

              // Small delay to show the redirecting animation
              setTimeout(() => {
                // IMPORTANT: Navigate FIRST, then clear cart
                navigate("/order-success", {
                  state: {
                    customerName: customer?.name,
                    orderDate: new Date().toISOString(),
                    orderId: pendingOrderId,
                    paymentVerified: true,
                    paymentMethod: "Razorpay",
                    totalAmount: data.totalAmount,
                  },
                  replace: true,
                });

                // Clear cart after navigation initiated
                setTimeout(() => {
                  clearCart();
                }, 100);
              }, 500);
              return true;
            } else if (data.paymentStatus === "Failed") {
              // Payment failed, clear pending order
              console.log("Payment failed");
              sessionStorage.removeItem("pending_order_id");
              setCheckingPendingPayment(false);
              return true;
            } else if (attempts < maxAttempts) {
              // Still initiated, poll again
              console.log(
                `Payment still processing, polling again (${attempts}/${maxAttempts})...`,
              );
              await new Promise((resolve) => setTimeout(resolve, pollInterval));
              return pollPaymentStatus();
            }

            // Max attempts reached, payment might not have been completed
            console.log("Max polling attempts reached, clearing pending order");
            sessionStorage.removeItem("pending_order_id");
            setCheckingPendingPayment(false);
            return false;
          };

          await pollPaymentStatus();
        } catch (error) {
          console.error("Error checking payment status:", error);
          sessionStorage.removeItem("pending_order_id");
          setCheckingPendingPayment(false);
        }
      }
    };

    checkPendingPayment();
  }, [navigate, customer, clearCart]);

  // Load fee settings on mount
  useEffect(() => {
    loadFeeSettings();
  }, []);

  // Dynamically load Razorpay script only on Payment page (performance optimization)
  useEffect(() => {
    if (
      !window.Razorpay &&
      !document.querySelector('script[src*="razorpay"]')
    ) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);



  // Redirect if no cart or order type (but not during order processing)
  useEffect(() => {
    // Use ref for immediate check to prevent race condition
    if (isProcessingOrder || isProcessingRef.current) return; // Don't redirect during order processing

    // Don't redirect if we just completed a successful payment
    // Check sessionStorage for recent successful payment
    const recentPayment = sessionStorage.getItem("payment_success");
    if (recentPayment) {
      const paymentTime = parseInt(recentPayment, 10);
      // If payment was within last 10 seconds, don't redirect
      if (Date.now() - paymentTime < 10000) {
        return;
      }
      sessionStorage.removeItem("payment_success");
    }

    // Small delay to ensure state is settled after payment flow
    const timer = setTimeout(() => {
      // Double-check ref hasn't been set during timeout
      if (isProcessingRef.current) return;

      // Only redirect if cart is actually empty
      if (cart.length === 0 && !isProcessingOrder) {
        navigate("/cart");
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [cart, orderType, navigate, isProcessingOrder]);

  const loadFeeSettings = async () => {
    try {
      const { data } = await getFeeSettings();
      setFeeSettings(data);
    } catch (error) {
      console.error("Error loading fee settings:", error);
    }
  };

  // Recalculate delivery fee when feeSettings, subtotal, or orderType changes
  useEffect(() => {
    if (orderType !== "Delivery") {
      setDeliveryFee(0);
      setFreeDelivery(false);
      return;
    }
    // If subtotal meets free delivery threshold, waive the fee
    if (subtotal >= feeSettings.freeDeliveryThreshold) {
      setDeliveryFee(0);
      setFreeDelivery(true);
    } else {
      setDeliveryFee(feeSettings.deliveryFeeBase || 30);
      setFreeDelivery(false);
    }
  }, [feeSettings, subtotal, orderType]);

  const calculateDelivery = async () => {
    try {
      const { data } = await calculateDeliveryFee(
        deliveryAddress.coordinates.lat,
        deliveryAddress.coordinates.lng,
        subtotal,
      );
      if (data.deliverable) {
        setDeliveryFee(data.deliveryFee);
        setFreeDelivery(data.freeDelivery);
      } else {
        alert(data.message);
        navigate("/cart");
      }
    } catch (error) {
      console.error("Error calculating delivery:", error);
      // Use fallback flat fee
      if (subtotal >= feeSettings.freeDeliveryThreshold) {
        setDeliveryFee(0);
        setFreeDelivery(true);
      } else {
        setDeliveryFee(feeSettings.deliveryFeeBase);
        setFreeDelivery(false);
      }
    }
  };


  const handleCheckout = async () => {
    if (paymentMethod === "Razorpay") {
      setShowUPIModal(true);
      return;
    }
    await processOrder();
  };

  const processOrder = async () => {
    // Ensure customer is logged in
    if (!customer) {
      alert("Please login to place an order");
      navigate('/login', { state: { from: '/cart' } });
      return;
    }

    const orderCustomer = customer;


    setLoading(true);

    try {
      const customerRes = await registerCustomer({
        name: orderCustomer.name,
        phone: orderCustomer.phone,
      });
      const userId = customerRes.data.user._id;

      const orderData = {
        user: userId,
        items: cart.map((item) => {
          const itemPrice = Number(item.price) || Number(item.basePrice) || 0;
          const itemQty = Number(item.quantity) || 1;
          return {
            product: item._id,
            name: item.name,
            quantity: itemQty,
            size: item.size,
            addons: item.selectedAddons,
            price: itemPrice, // Per-unit price — backend/receipt calculates total as price * quantity
          };
        }),
        totalAmount: grandTotal,
        paymentMethod,
        orderType,
        deliveryAddress: orderType === "Delivery" ? deliveryAddress : undefined,
        deliveryFee,
      };

      const response = await createOrder(orderData);

      // Log activity
      try {
        await logUserActivity({
          type: 'order_placed',
          description: `Order placed — ${orderType} — ${paymentMethod}`,
          orderId: response.data._id,
          amount: grandTotal,
        });
      } catch (e) { /* activity log is non-critical */ }

      // Set both ref (immediate) and state to prevent redirect race condition
      isProcessingRef.current = true;
      setIsProcessingOrder(true);

      // Mark successful order in sessionStorage to prevent redirect on any re-renders
      sessionStorage.setItem("payment_success", Date.now().toString());

      // Clear cart first
      clearCart();

      // Navigate to order success with replace to prevent back navigation
      navigate("/order-success", {
        state: {
          customerName: customer.name,
          orderDate: new Date().toISOString(),
          orderId: response.data._id,
          paymentMethod: paymentMethod,
          totalAmount: grandTotal,
        },
        replace: true,
      });
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message;
      alert(msg || "Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUPIPaymentInitiated = () => {
    processOrder();
  };

  const handleRazorpaySuccess = (result) => {
    // Set both ref (immediate) and state to prevent redirect race condition
    isProcessingRef.current = true;
    setIsProcessingOrder(true);
    setShowUPIModal(false); // Close the payment modal
    setIsRedirecting(true); // Show redirecting loader

    // Mark successful payment in sessionStorage to prevent redirect on any re-renders
    sessionStorage.setItem("payment_success", Date.now().toString());

    // Small delay to show the redirecting animation
    setTimeout(() => {
      // IMPORTANT: Navigate FIRST, then clear cart
      // This prevents race condition where cart clear triggers empty cart redirect
      navigate("/order-success", {
        state: {
          customerName: customer?.name,
          orderDate: new Date().toISOString(),
          orderId: result.orderId,
          paymentId: result.paymentId,
          paymentVerified: !result.paymentPending,
          paymentMethod: "Razorpay",
          totalAmount: grandTotal,
        },
        replace: true,
      });

      // Clear cart AFTER navigation is initiated
      setTimeout(() => {
        clearCart();
      }, 100);
    }, 500); // Show loader for 500ms before redirecting
  };

  const paymentMethods = [
    {
      id: "Razorpay",
      label: "Pay Online",
      icon: FaCreditCard,
      desc: "UPI • Cards • Netbanking",
    },
    {
      id: "Cash",
      label: "Cash on Delivery",
      icon: FaMoneyBillWave,
      desc: "Pay when order arrives",
    },
  ];

  // Show loading overlay when checking pending payment
  if (checkingPendingPayment) {
    return (
      <div className="min-h-screen bg-[var(--bg-page)] flex items-center justify-center">
        <div className="bg-white rounded-3xl p-8 shadow-xl text-center max-w-sm mx-4 border border-[var(--border-light)]">
          <div className="w-16 h-16 border-4 border-[var(--accent-gold)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-[var(--text-dark)] mb-2">
            Verifying Payment...
          </h2>
          <p className="text-[var(--text-muted)] text-sm">
            Please wait while we confirm your payment status
          </p>
        </div>
      </div>
    );
  }

  // Show redirecting loader after successful payment
  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-[var(--bg-page)] flex items-center justify-center">
        <div className="bg-white rounded-3xl p-8 shadow-xl text-center max-w-sm mx-4 border border-[var(--border-light)]">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-green-100">
            <FaCheckCircle className="text-green-500 text-4xl" />
          </div>
          <h2 className="text-xl font-bold text-[var(--text-dark)] mb-2">
            Payment Successful!
          </h2>
          <p className="text-[var(--text-muted)] text-sm mb-4">
            Redirecting to your order status...
          </p>
          <div className="w-10 h-10 border-4 border-[var(--accent-gold)] border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-page)] pb-32">
      {/* Header */}
      <header className="bakery-header px-4 py-4 shadow-sm flex justify-between items-center sticky top-0 z-10 safe-area-top">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-12 h-12 rounded-2xl flex items-center justify-center active:scale-95 transition-all"
            style={{ background: 'rgba(252, 128, 25, 0.1)' }}
          >
            <FaArrowLeft size={18} color="#C97B4B" />
          </button>
          <div>
            <h1 className="text-xl font-black" style={{ color: '#C97B4B' }}>Payment</h1>
            <p className="text-sm" style={{ color: '#7E7E7E' }}>Complete your order</p>
          </div>
        </div>
        {customer && (
          <div className="flex flex-col items-end">
            <div className="text-[10px] uppercase font-bold tracking-wider mb-0.5" style={{ color: '#C97B4B' }}>
              {orderType}
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg" style={{ border: '1px solid rgba(252, 128, 25, 0.3)', background: 'rgba(252, 128, 25, 0.1)' }}>
              <span className="text-xs font-bold max-w-[80px] truncate" style={{ color: '#C97B4B' }}>
                {customer.name}
              </span>
            </div>
          </div>
        )}
      </header>

      <div className="p-4 space-y-4">
        {/* Razorpay Test Mode Warning */}
        {razorpayMode === 'test' && (
          <div style={{
            background: '#FEF9E7',
            border: '1.5px solid #F4D03F',
            borderRadius: '14px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{ fontSize: '20px' }}>⚠️</span>
            <div>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#7D6608', margin: 0 }}>Test Mode — No real charges</p>
              <p style={{ fontSize: '11px', color: '#9A7D0A', margin: 0, marginTop: '2px' }}>Payments are simulated. Use test cards only.</p>
            </div>
          </div>
        )}
        {/* Order Summary Card */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-[var(--border-light)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-[var(--bg-cream)] rounded-full -mr-10 -mt-10 opacity-50"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h3 className="font-bold text-[var(--text-dark)] flex items-center gap-2 text-lg">
              🛒 Order Summary
            </h3>
            <span className="text-sm font-medium px-2 py-1 rounded-lg bg-[var(--bg-cream)] text-[var(--accent-brown)]">
              {cart.length} item{cart.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="space-y-3 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
            {cart.map((item) => (
              <div
                key={item.cartId}
                className="flex justify-between items-center text-sm group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--bg-cream)] border border-[var(--border-light)] flex items-center justify-center text-lg">
                    {item.image ? <img src={item.image} alt="" className="w-full h-full object-cover rounded-lg" /> : '🍰'}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[var(--text-dark)] font-medium">{item.name}</span>
                    <span className="text-[var(--text-muted)] text-xs">Qty: {item.quantity}</span>
                  </div>
                </div>
                <span className="font-bold text-[var(--text-brown)]">
                  ₹{((Number(item.price) || Number(item.basePrice) || 0) * (Number(item.quantity) || 1)).toFixed(0)}
                </span>
              </div>
            ))}
          </div>
        </div>



        {/* Delivery Address Display */}
        {orderType === "Delivery" && deliveryAddress && (
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-[var(--border-light)]">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[var(--bg-cream)] rounded-xl flex items-center justify-center flex-shrink-0 border border-[var(--border-light)]">
                <FaMapMarkerAlt className="text-[var(--accent-brown)]" size={20} />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-[var(--text-dark)] mb-1">
                  Delivery Address
                </h4>
                <p className="text-sm text-[var(--text-brown)] font-medium leading-relaxed">
                  {deliveryAddress.manualAddress}
                </p>
                {deliveryAddress.landmark && (
                  <p className="text-xs text-[var(--text-muted)] mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-gold)]"></span>
                    Landmark: {deliveryAddress.landmark}
                  </p>
                )}
              </div>
              <button
                onClick={() => navigate("/cart")}
                className="text-xs text-[var(--accent-gold)] font-bold uppercase tracking-wide border-b border-[var(--accent-gold)] pb-0.5"
              >
                Change
              </button>
            </div>
            {freeDelivery && (
              <div className="mt-4 flex items-center gap-3 bg-green-50 text-green-700 px-4 py-3 rounded-2xl text-sm font-semibold border border-green-100">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <FaTruck size={14} />
                </div>
                <span>🎉 Free Delivery Applied!</span>
              </div>
            )}
          </div>
        )}


        {/* Payment Methods */}
        <div>
          <h3 className="font-bold text-[var(--text-dark)] text-lg mb-4 flex items-center gap-2 pl-1">
            💳 Payment Method
          </h3>
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => setPaymentMethod(method.id)}
                className={`w-full p-5 rounded-3xl border-2 flex items-center gap-4 transition-all active:scale-[0.98] relative overflow-hidden group ${paymentMethod === method.id
                  ? "border-[var(--accent-gold)] bg-[#FEF3E2]"
                  : "border-[var(--border-light)] bg-white hover:border-[#D4B87A]"
                  }`}
              >
                {paymentMethod === method.id && (
                  <div className="absolute top-0 right-0 p-2">
                    <div className="bg-[var(--accent-gold)] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">SELECTED</div>
                  </div>
                )}

                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${paymentMethod === method.id
                    ? "bg-[var(--accent-gold)] text-white shadow-lg shadow-[#C9A962]/30"
                    : "bg-[var(--bg-cream)] text-[var(--text-muted)] group-hover:bg-[#F5EAD6]"
                    }`}
                >
                  <method.icon size={24} />
                </div>
                <div className="flex-1 text-left">
                  <p className={`font-bold text-base transition-colors ${paymentMethod === method.id ? "text-[var(--text-dark)]" : "text-[var(--text-brown)]"}`}>
                    {method.label}
                  </p>
                  <p className={`text-sm ${paymentMethod === method.id ? "text-[var(--accent-brown)]" : "text-[var(--text-light)]"}`}>{method.desc}</p>
                </div>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${paymentMethod === method.id
                    ? "border-[var(--accent-gold)]"
                    : "border-[var(--border-card)]"
                    }`}
                >
                  {paymentMethod === method.id && (
                    <div className="w-3 h-3 bg-[var(--accent-gold)] rounded-full shadow-sm"></div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Bill Summary - Simplified (No Tax, No Platform Fee) */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-[var(--border-light)] mb-20 relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--accent-gold)] to-transparent opacity-30"></div>
          <h3 className="font-bold text-[var(--text-dark)] text-lg mb-5 flex items-center gap-2">
            🧾 Bill Details
          </h3>
          <div className="space-y-3 text-base">
            <div className="flex justify-between text-[var(--text-brown)]">
              <span>Item Total</span>
              <span className="font-semibold text-[var(--text-dark)]">₹{(Number(subtotal) || 0).toFixed(0)}</span>
            </div>
            {orderType === "Delivery" && (
              <div className="flex justify-between text-[var(--text-muted)]">
                <span className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-[var(--bg-cream)] flex items-center justify-center">
                    <FaTruck size={10} />
                  </div>
                  Delivery Fee
                </span>
                <span>₹30</span>
              </div>
            )}
            <div className="border-t-2 border-dashed border-[var(--border-light)] pt-4 mt-4">
              <div className="flex justify-between text-xl font-bold text-[var(--text-dark)] items-center">
                <span>To Pay</span>
                <span className="text-[var(--accent-brown)] text-2xl">
                  ₹{(Number(grandTotal) || 0).toFixed(0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Button - Fixed */}
      <div className="fixed bottom-0 left-0 right-0 p-4 z-20 safe-area-bottom"
        style={{ background: 'linear-gradient(180deg, transparent 0%, #FFFFFF 20%, #FFFFFF 100%)' }}>
        <button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full h-16 text-white font-bold text-lg rounded-2xl active:scale-[0.98] transition-all flex justify-between items-center px-6 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(135deg, #C97B4B 0%, #E8956A 100%)',
            boxShadow: '0 8px 32px rgba(252, 128, 25, 0.4)'
          }}
        >
          <div className="flex items-center gap-3">
            {paymentMethod === "Razorpay" ? (
              <FaCreditCard size={22} className="opacity-90" />
            ) : (
              <FaMoneyBillWave size={22} className="opacity-90" />
            )}
            <span>
              {loading
                ? "Placing Order..."
                : paymentMethod === "Razorpay"
                  ? "Pay Securely"
                  : "Place Order (COD)"}
            </span>
          </div>
          <span className="bg-white/20 backdrop-blur-sm px-5 py-2 rounded-xl font-black text-xl border border-white/10">
            ₹{(Number(grandTotal) || 0).toFixed(0)}
          </span>
        </button>
      </div>

      {/* UPI Payment Modal */}
      <UPIPaymentModal
        isOpen={showUPIModal}
        onClose={() => setShowUPIModal(false)}
        amount={grandTotal}
        orderDetails={{ orderId: `ORD-${Date.now()}` }}
        onPaymentInitiated={handleUPIPaymentInitiated}
        onRazorpaySuccess={handleRazorpaySuccess}
        customerInfo={customer}
        items={cart}
        orderType={orderType}
        deliveryAddress={deliveryAddress}
        customerNote=""
      />


      {/* Custom CSS */}
      <style>{`
        .safe-area-top { padding-top: env(safe-area-inset-top); }
        .safe-area-bottom { padding-bottom: env(safe-area-inset-bottom); }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border-card); border-radius: 4px; }
      `}</style>

      <Footer />
    </div>
  );
};

export default Payment;
