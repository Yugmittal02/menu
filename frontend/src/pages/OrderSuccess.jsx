import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaCheckCircle,
  FaReceipt,
  FaPhoneAlt,
  FaSpinner,
  FaUtensils,
  FaBoxOpen,
  FaClock,
  FaGift,
  FaHeart,
  FaTruck,
  FaStar,
  FaTimes,
  FaCamera,
  FaUpload,
} from "react-icons/fa";
import {
  fetchOrderStatus,
  getStoreSettings,
  cancelOrder,
  submitRating,
  uploadImage,
  uploadPaymentScreenshot,
} from "../services/api";
import Footer from "../components/Footer";
import { verifyPayment, getPaymentStatus } from "../services/api";

const OrderSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = location;

  // Parse URL query params for UPI redirect callback
  const searchParams = new URLSearchParams(location.search);
  const urlOrderId = searchParams.get("orderId");
  const razorpayOrderId = searchParams.get("razorpay_order_id");
  const razorpayPaymentId = searchParams.get("razorpay_payment_id");
  const razorpaySignature = searchParams.get("razorpay_signature");

  // Use orderId from state, URL params, or sessionStorage fallback (for page refresh)
  const orderId = state?.orderId || urlOrderId || sessionStorage.getItem("current_order_id");

  // Persist orderId to sessionStorage for refresh resilience
  useEffect(() => {
    if (orderId) {
      sessionStorage.setItem("current_order_id", orderId);
    }
  }, [orderId]);

  // Redirect if no orderId from any source
  useEffect(() => {
    if (!orderId) {
      navigate("/");
    }
  }, [orderId, navigate]);

  // Handle UPI redirect callback - verify payment if params present
  useEffect(() => {
    const handleUPICallback = async () => {
      if (
        razorpayPaymentId &&
        razorpayOrderId &&
        razorpaySignature &&
        urlOrderId
      ) {
        try {
          console.log("Verifying UPI payment from redirect...");
          await verifyPayment({
            razorpay_order_id: razorpayOrderId,
            razorpay_payment_id: razorpayPaymentId,
            razorpay_signature: razorpaySignature,
            orderId: urlOrderId,
          });
          console.log("Payment verified successfully");
          // Persist orderId before clearing URL params
          sessionStorage.setItem("current_order_id", urlOrderId);
          // Clear URL params after successful verification
          window.history.replaceState({}, "", `/order-success`);
        } catch (error) {
          console.error("Payment verification from redirect failed:", error);
          // Still persist orderId even if verification fails — webhook will handle it
          sessionStorage.setItem("current_order_id", urlOrderId);
          window.history.replaceState({}, "", `/order-success`);
        }
      }
    };
    handleUPICallback();
  }, [razorpayPaymentId, razorpayOrderId, razorpaySignature, urlOrderId]);

  const [showContent, setShowContent] = useState(false);
  const [adminPhone, setAdminPhone] = useState("9876543210");
  const [orderData, setOrderData] = useState(null);
  const [orderStatus, setOrderStatus] = useState("Pending");
  const [isAccepted, setIsAccepted] = useState(false);

  // Cancellation countdown state
  const [cancelCountdown, setCancelCountdown] = useState(30);
  const [canCancel, setCanCancel] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  // Rating state
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [ratingLoading, setRatingLoading] = useState(false);

  // Payment screenshot state
  const [screenshotUploading, setScreenshotUploading] = useState(false);
  const [screenshotUploaded, setScreenshotUploaded] = useState(false);
  const [screenshotError, setScreenshotError] = useState("");
  const fileInputRef = useRef(null);
  const [upiAppOpened, setUpiAppOpened] = useState(false);

  // Determine if we should show payment gate (only for legacy UPI orders without screenshot)
  // Razorpay orders are auto-verified and don't need screenshot
  const isRazorpayOrder =
    orderData?.paymentMethod === "Razorpay" ||
    state?.paymentMethod === "Razorpay" ||
    state?.paymentVerified;
  const isUPIOrder =
    orderData?.paymentMethod === "UPI" || state?.paymentMethod === "UPI";
  const showPaymentGate =
    isUPIOrder &&
    !isRazorpayOrder &&
    !screenshotUploaded &&
    orderStatus !== "Cancelled";

  useEffect(() => {
    setTimeout(() => setShowContent(true), 100);

    // Fetch store settings
    const loadSettings = async () => {
      try {
        const { data } = await getStoreSettings();
        if (data.adminPhone) {
          setAdminPhone(data.adminPhone);
        }
      } catch (error) {
        console.error("Failed to load store settings:", error);
      }
    };
    loadSettings();

    // Poll for order status - use orderId from state or URL
    if (orderId) {
      const pollStatus = async () => {
        try {
          const { data } = await fetchOrderStatus(orderId);
          setOrderData(data);
          setOrderStatus(data.status);
          setIsAccepted(data.isAccepted || false);

          // Disable cancel if order is accepted or status changed
          if (data.isAccepted || data.status !== "Pending") {
            setCanCancel(false);
          }

          // Show rating option when order is delivered
          if (data.status === "Delivered" && !ratingSubmitted) {
            setShowRating(true);
          }
        } catch (error) {
          console.error("Failed to track order:", error);
        }
      };

      pollStatus();
      const interval = setInterval(pollStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [orderId, ratingSubmitted]);

  // Check if screenshot already uploaded
  useEffect(() => {
    if (orderData?.paymentScreenshot?.url) {
      setScreenshotUploaded(true);
    }
  }, [orderData]);

  // Note: Removed auto-open UPI app - now using Razorpay which handles payment in-app

  // Cancellation countdown timer
  useEffect(() => {
    if (!canCancel || isAccepted || orderStatus !== "Pending") {
      return;
    }

    if (cancelCountdown <= 0) {
      setCanCancel(false);
      return;
    }

    const timer = setTimeout(() => {
      setCancelCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [cancelCountdown, canCancel, isAccepted, orderStatus]);

  // Handle order cancellation
  const handleCancelOrder = async () => {
    if (!canCancel || isCancelling) return;

    setIsCancelling(true);
    try {
      await cancelOrder(orderId);
      setOrderStatus("Cancelled");
      setCanCancel(false);
    } catch (error) {
      console.error("Failed to cancel order:", error);
      alert(error.response?.data?.message || "Failed to cancel order");
    } finally {
      setIsCancelling(false);
    }
  };

  // Handle rating submission
  const handleSubmitRating = async () => {
    if (rating === 0 || ratingLoading) return;

    setRatingLoading(true);
    try {
      // Get the first product ID from the order items for the rating
      const firstProductId = orderData?.items?.[0]?.product?._id || orderData?.items?.[0]?.product;

      await submitRating({
        orderId: orderId,
        productId: firstProductId,
        customer: {
          name: state?.customerName || "Customer",
          phone: "N/A",
        },
        rating,
        comment: ratingComment,
      });
      setRatingSubmitted(true);
      setShowRating(false);
    } catch (error) {
      console.error("Failed to submit rating:", error);
      alert("Failed to submit rating. Please try again.");
    } finally {
      setRatingLoading(false);
    }
  };

  // Handle payment screenshot upload
  const handleScreenshotUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setScreenshotError("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setScreenshotError("Image size should be less than 5MB");
      return;
    }

    setScreenshotUploading(true);
    setScreenshotError("");

    try {
      // Upload image to Cloudinary
      const formData = new FormData();
      formData.append("image", file);

      const uploadRes = await uploadImage(formData);
      const imageUrl = uploadRes.data.url;

      // Link screenshot to order
      await uploadPaymentScreenshot(orderId, imageUrl);

      setScreenshotUploaded(true);
    } catch (error) {
      console.error("Failed to upload screenshot:", error);
      setScreenshotError(
        error.response?.data?.message || "Failed to upload screenshot",
      );
    } finally {
      setScreenshotUploading(false);
    }
  };

  const steps = [
    { status: "Pending", label: "Order Received", icon: FaReceipt },
    { status: "Preparing", label: "Preparing", icon: FaUtensils },
    { status: "Ready", label: "Ready", icon: FaBoxOpen },
    { status: "Delivered", label: "Completed", icon: FaCheckCircle },
  ];

  const getCurrentStepIndex = () => {
    if (orderStatus === "Cancelled") return -1;
    const idx = steps.findIndex((s) => s.status === orderStatus);
    return idx === -1 ? 0 : idx;
  };

  const currentStepIndex = getCurrentStepIndex();

  // Calculate subtotal from items
  const subtotal =
    orderData?.items?.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    ) || 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-emerald-50 flex flex-col relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-10 text-6xl opacity-10 animate-float-1">
          🎉
        </div>
        <div className="absolute top-20 right-10 text-4xl opacity-10 animate-float-2">
          ✨
        </div>
        <div className="absolute bottom-20 left-20 text-5xl opacity-10 animate-float-3">
          🎊
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 py-8 px-4">
        <div
          className={`relative z-10 max-w-md mx-auto transition-all duration-700 ${
            showContent
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-10"
          }`}
        >
          {/* UPI Payment Gate - Shows FIRST for UPI orders until screenshot uploaded */}
          {showPaymentGate ? (
            <div className="text-center">
              {/* Payment Header */}
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
                <span className="text-4xl">💳</span>
              </div>

              <h1 className="text-2xl font-black text-gray-800 mb-2">
                Complete Your Payment
              </h1>
              <p className="text-gray-500 font-medium mb-6">
                Pay ₹{orderData?.totalAmount || state?.totalAmount || 0} via UPI
              </p>

              {/* Payment Card */}
              <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 mb-6">
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-5 border-2 border-orange-100 mb-5">
                  <p className="text-sm text-orange-600 font-medium mb-1">
                    Amount to Pay
                  </p>
                  <p className="text-4xl font-black text-gray-900">
                    ₹
                    {(
                      orderData?.totalAmount ||
                      state?.totalAmount ||
                      0
                    ).toFixed(0)}
                  </p>
                </div>

                {/* Open UPI App Button */}
                {!upiAppOpened && (
                  <button
                    onClick={() => {
                      if (state?.upiLink) {
                        window.location.href = state.upiLink;
                        setUpiAppOpened(true);
                      }
                    }}
                    className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg mb-4"
                  >
                    📱 Open UPI App to Pay
                  </button>
                )}

                {/* After UPI App Opened - Show Screenshot Upload */}
                {upiAppOpened && (
                  <div className="bg-green-50 rounded-2xl p-4 border border-green-100 mb-4">
                    <FaCheckCircle className="text-green-500 text-2xl mx-auto mb-2" />
                    <p className="font-bold text-green-700 text-sm">
                      UPI App Opened!
                    </p>
                    <p className="text-xs text-green-600">
                      Complete payment in your UPI app
                    </p>
                  </div>
                )}

                {/* Hidden file input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleScreenshotUpload}
                  accept="image/*"
                  className="hidden"
                />

                {screenshotError && (
                  <p className="text-red-500 text-sm mb-3">{screenshotError}</p>
                )}

                {/* Screenshot Upload Button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={screenshotUploading}
                  className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg disabled:opacity-50"
                >
                  {screenshotUploading ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <FaUpload />
                      Upload Payment Screenshot
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-400 mt-3">
                  📸 Take a screenshot of your successful payment and upload it
                </p>
              </div>

              {/* Skip Option (for testing/COD alternative) */}
              <button
                onClick={() => setScreenshotUploaded(true)}
                className="text-sm text-gray-400 underline"
              >
                I'll upload later / Skip for now
              </button>
            </div>
          ) : (
            <>
              {/* Normal Order Status Content */}
              {/* Status Header */}
              <div className="text-center mb-6">
                {!isAccepted && orderStatus === "Pending" ? (
                  <>
                    <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-xl">
                      <FaClock className="text-yellow-600 text-3xl animate-pulse" />
                    </div>
                    <h1 className="text-2xl font-black text-gray-800 mb-1">
                      Waiting for Confirmation
                    </h1>
                    <p className="text-gray-500 font-medium">
                      The store will confirm your order shortly!
                    </p>
                  </>
                ) : orderStatus === "Cancelled" ? (
                  <>
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-xl">
                      <span className="text-3xl">❌</span>
                    </div>
                    <h1 className="text-2xl font-black text-gray-800 mb-1">
                      Order Cancelled
                    </h1>
                    <p className="text-gray-500 font-medium">
                      This order was cancelled.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-xl animate-pulse-slow">
                      <FaCheckCircle className="text-green-600 text-3xl" />
                    </div>
                    <h1 className="text-2xl font-black text-gray-800 mb-1">
                      Order Confirmed! 🎉
                    </h1>
                    <p className="text-gray-500 font-medium">
                      Thank You, {state?.customerName || "Friend"}!
                    </p>
                  </>
                )}

                {/* Payment Verified Badge */}
                {state?.paymentVerified && (
                  <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-bold">
                    <FaCheckCircle />
                    Payment Verified
                  </div>
                )}


                {/* Donation Badge */}
                {state?.donationAmount > 0 && (
                  <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-pink-100 text-pink-700 rounded-full text-sm font-bold ml-2">
                    <FaHeart />
                    Donated ₹{state.donationAmount}
                  </div>
                )}
              </div>

              {/* Status Tracker */}
              {orderStatus !== "Cancelled" && (
                <div className="bg-white rounded-3xl p-5 shadow-xl shadow-green-100/50 border border-white mb-4">
                  <div className="flex justify-between relative">
                    {/* Connector Line */}
                    <div className="absolute top-1/3 left-0 right-0 h-1 bg-gray-100 -z-0 rounded-full mx-4">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all duration-1000"
                        style={{
                          width: `${(currentStepIndex / (steps.length - 1)) * 100}%`,
                        }}
                      ></div>
                    </div>

                    {steps.map((step, idx) => {
                      const isCompleted = idx <= currentStepIndex;
                      const isCurrent = idx === currentStepIndex;
                      const Icon = step.icon;

                      return (
                        <div
                          key={idx}
                          className="relative z-10 flex flex-col items-center gap-2"
                        >
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                              isCompleted
                                ? "bg-green-500 border-green-500 text-white shadow-lg shadow-green-200"
                                : "bg-white border-gray-200 text-gray-300"
                            }`}
                          >
                            <Icon size={14} />
                          </div>
                          <span
                            className={`text-[10px] font-bold transition-all duration-300 ${
                              isCurrent
                                ? "text-green-600 scale-110"
                                : "text-gray-400"
                            }`}
                          >
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Status Message */}
                  <div className="mt-5 bg-green-50 rounded-xl p-3 text-green-800 text-sm font-bold flex items-center justify-center gap-2">
                    {orderStatus === "Pending" && !isAccepted && (
                      <FaSpinner className="animate-spin" />
                    )}
                    {orderStatus === "Preparing" && (
                      <FaUtensils className="animate-bounce" />
                    )}
                    <span>
                      {orderStatus === "Pending" &&
                        !isAccepted &&
                        "Waiting for store to accept..."}
                      {orderStatus === "Pending" &&
                        isAccepted &&
                        "Order accepted! Processing..."}
                      {orderStatus === "Preparing" &&
                        "Chef is preparing your food!"}
                      {orderStatus === "Ready" && "Your order is ready!"}
                      {orderStatus === "Delivered" && "Order Completed! Enjoy!"}
                    </span>
                  </div>

                  {/* Cancellation Countdown */}
                  {canCancel && orderStatus === "Pending" && !isAccepted && (
                    <div className="mt-4 bg-red-50 rounded-xl p-4 border border-red-100">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <FaTimes className="text-red-500" />
                          <span className="text-sm font-bold text-red-700">
                            Cancel Order?
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-full border-4 border-red-200 flex items-center justify-center relative">
                            <span className="text-sm font-black text-red-600">
                              {cancelCountdown}
                            </span>
                            <svg
                              className="absolute inset-0 w-full h-full -rotate-90"
                              viewBox="0 0 36 36"
                            >
                              <circle
                                cx="18"
                                cy="18"
                                r="16"
                                fill="none"
                                stroke="#fecaca"
                                strokeWidth="3"
                              />
                              <circle
                                cx="18"
                                cy="18"
                                r="16"
                                fill="none"
                                stroke="#ef4444"
                                strokeWidth="3"
                                strokeDasharray={`${(cancelCountdown / 30) * 100} 100`}
                                strokeLinecap="round"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={handleCancelOrder}
                        disabled={isCancelling}
                        className="w-full py-3 bg-red-500 text-white font-bold rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isCancelling ? (
                          <>
                            <FaSpinner className="animate-spin" />
                            Cancelling...
                          </>
                        ) : (
                          <>
                            <FaTimes />
                            Cancel Order ({cancelCountdown}s)
                          </>
                        )}
                      </button>
                      <p className="text-xs text-red-400 mt-2 text-center">
                        You can cancel within 30 seconds if the order hasn't
                        been accepted
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Receipt / Order Details */}
              <div className="bg-white rounded-3xl p-5 shadow-lg border border-gray-100 mb-4">
                <h3 className="font-bold text-gray-800 text-base mb-4 flex items-center gap-2">
                  <FaReceipt className="text-orange-500" />
                  Order Receipt
                </h3>

                {/* Order Info */}
                <div className="flex justify-between text-sm mb-3 pb-3 border-b border-gray-100">
                  <span className="text-gray-500">Order ID</span>
                  <span className="font-bold text-gray-700 font-mono">
                    #{state?.orderId?.slice(-6).toUpperCase() || "---"}
                  </span>
                </div>
                <div className="flex justify-between text-sm mb-3 pb-3 border-b border-gray-100">
                  <span className="text-gray-500">Date & Time</span>
                  <span className="font-medium text-gray-700">
                    {state?.orderDate
                      ? new Date(state.orderDate).toLocaleString("en-IN", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "---"}
                  </span>
                </div>
                {orderData?.orderType && (
                  <div className="flex justify-between text-sm mb-3 pb-3 border-b border-gray-100">
                    <span className="text-gray-500">Order Type</span>
                    <span className="font-medium text-gray-700 flex items-center gap-1">
                      {orderData.orderType === "Delivery" && (
                        <FaTruck size={12} />
                      )}
                      {orderData.orderType}
                    </span>
                  </div>
                )}

                {/* Items */}
                {orderData?.items && orderData.items.length > 0 && (
                  <div className="mb-3 pb-3 border-b border-gray-100">
                    <p className="text-xs text-gray-400 uppercase font-bold mb-2">
                      Items
                    </p>
                    <div className="space-y-2">
                      {orderData.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-gray-700">
                            {item.quantity}× {item.name}
                            {item.size && (
                              <span className="text-gray-400 ml-1">
                                ({item.size})
                              </span>
                            )}
                          </span>
                          <span className="font-semibold text-gray-700">
                            ₹{(item.price * item.quantity).toFixed(0)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bill Breakdown */}
                <div className="space-y-2 text-sm">
                  {orderData && (
                    <>
                      <div className="flex justify-between text-gray-500">
                        <span>Subtotal</span>
                        <span>₹{subtotal.toFixed(0)}</span>
                      </div>
                      {orderData.taxAmount > 0 && (
                        <div className="flex justify-between text-gray-500">
                          <span>Tax (GST)</span>
                          <span>₹{orderData.taxAmount.toFixed(0)}</span>
                        </div>
                      )}
                      {orderData.platformFee > 0 && (
                        <div className="flex justify-between text-gray-500">
                          <span>Platform Fee</span>
                          <span>₹{orderData.platformFee.toFixed(2)}</span>
                        </div>
                      )}
                      {orderData.deliveryFee > 0 && (
                        <div className="flex justify-between text-gray-500">
                          <span>Delivery Fee</span>
                          <span>₹{orderData.deliveryFee.toFixed(0)}</span>
                        </div>
                      )}

                      {orderData.donationAmount > 0 && (
                        <div className="flex justify-between text-pink-600 font-medium">
                          <span>Donation 💕</span>
                          <span>+ ₹{orderData.donationAmount.toFixed(0)}</span>
                        </div>
                      )}
                    </>
                  )}

                  <div className="border-t border-dashed border-gray-200 pt-3 mt-3">
                    <div className="flex justify-between text-lg font-black text-gray-900">
                      <span>Total</span>
                      <span className="text-orange-600">
                        ₹
                        {orderData?.totalAmount?.toFixed(0) ||
                          state?.totalAmount ||
                          "---"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Screenshot Upload - Only for UPI orders */}
              {orderData?.paymentMethod === "UPI" &&
                orderStatus !== "Cancelled" && (
                  <div className="bg-white rounded-3xl p-5 shadow-lg border border-gray-100 mb-4">
                    <h3 className="font-bold text-gray-800 text-base mb-3 flex items-center gap-2">
                      <FaCamera className="text-blue-500" />
                      Payment Screenshot
                    </h3>

                    {/* Hidden file input */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleScreenshotUpload}
                      accept="image/*"
                      className="hidden"
                    />

                    {screenshotUploaded || orderData?.paymentScreenshot?.url ? (
                      <div className="text-center">
                        {orderData?.paymentScreenshot?.verified ? (
                          <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                            <FaCheckCircle className="text-green-500 text-2xl mx-auto mb-2" />
                            <p className="font-bold text-green-700">
                              Payment Verified! ✅
                            </p>
                            <p className="text-sm text-green-600">
                              Your payment has been confirmed by the store.
                            </p>
                          </div>
                        ) : (
                          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                            <FaClock className="text-blue-500 text-2xl mx-auto mb-2" />
                            <p className="font-bold text-blue-700">
                              Screenshot Uploaded
                            </p>
                            <p className="text-sm text-blue-600">
                              Waiting for store to verify your payment...
                            </p>
                          </div>
                        )}

                        {orderData?.paymentScreenshot?.url && (
                          <div className="mt-3">
                            <img
                              src={orderData.paymentScreenshot.url}
                              alt="Payment Screenshot"
                              className="max-h-40 mx-auto rounded-lg border border-gray-200"
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 mb-4">
                          <p className="text-sm text-amber-700">
                            📸 Please upload a screenshot of your UPI payment to
                            verify your order.
                          </p>
                        </div>

                        {screenshotError && (
                          <p className="text-red-500 text-sm mb-3">
                            {screenshotError}
                          </p>
                        )}

                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={screenshotUploading}
                          className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {screenshotUploading ? (
                            <>
                              <FaSpinner className="animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <FaUpload />
                              Upload Payment Screenshot
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}

              {/* Admin Contact Button */}
              <a
                href={`tel:${adminPhone}`}
                className="block w-full bg-white border-2 border-orange-100 text-gray-700 font-bold py-4 rounded-2xl hover:bg-orange-50 hover:border-orange-200 transition-colors flex items-center justify-center gap-2 mb-4"
              >
                <FaPhoneAlt className="text-orange-500" />
                <span>Call Store: {adminPhone}</span>
              </a>

              {/* Rating Section */}
              {showRating && !ratingSubmitted && (
                <div className="bg-white rounded-3xl p-5 shadow-lg border border-gray-100 mb-4">
                  <h3 className="font-bold text-gray-800 text-base mb-4 flex items-center gap-2">
                    <FaStar className="text-amber-500" />
                    Rate Your Experience
                  </h3>

                  {/* Star Rating */}
                  <div className="flex justify-center gap-2 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 transition-transform hover:scale-110 active:scale-95"
                      >
                        <FaStar
                          size={32}
                          className={`transition-colors ${
                            star <= (hoverRating || rating)
                              ? "text-amber-400"
                              : "text-gray-200"
                          }`}
                        />
                      </button>
                    ))}
                  </div>

                  {rating > 0 && (
                    <p className="text-center text-sm font-medium text-gray-500 mb-4">
                      {rating === 1 && "Poor 😔"}
                      {rating === 2 && "Fair 😐"}
                      {rating === 3 && "Good 🙂"}
                      {rating === 4 && "Very Good 😊"}
                      {rating === 5 && "Excellent! 🤩"}
                    </p>
                  )}

                  {/* Comment Input */}
                  <textarea
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    placeholder="Share your feedback (optional)"
                    rows={3}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 mb-4"
                  />

                  {/* Submit Button */}
                  <button
                    onClick={handleSubmitRating}
                    disabled={rating === 0 || ratingLoading}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {ratingLoading ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <FaStar />
                        Submit Rating
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Rating Submitted Confirmation */}
              {ratingSubmitted && (
                <div className="bg-green-50 rounded-2xl p-4 mb-4 text-center border border-green-100">
                  <FaCheckCircle className="text-green-500 text-2xl mx-auto mb-2" />
                  <p className="font-bold text-green-700">
                    Thank you for your feedback!
                  </p>
                  <p className="text-sm text-green-600">
                    Your rating helps us improve.
                  </p>
                </div>
              )}

              {/* Home Button */}
              <button
                onClick={() => navigate("/menu")}
                className="w-full text-gray-400 font-semibold text-sm hover:text-gray-600 transition-colors text-center"
              >
                Return to Menu
              </button>
            </>
          )}
        </div>
      </div>

      <Footer />

      {/* Custom CSS */}
      <style>{`
        @keyframes float-1 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(180deg); }
        }
        @keyframes float-2 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(-180deg); }
        }
        @keyframes float-3 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-25px) rotate(90deg); }
        }
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .animate-float-1 { animation: float-1 4s ease-in-out infinite; }
        .animate-float-2 { animation: float-2 5s ease-in-out infinite; }
        .animate-float-3 { animation: float-3 3.5s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulse-slow 2s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default OrderSuccess;
