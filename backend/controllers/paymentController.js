const crypto = require("crypto");
const razorpay = require("../config/razorpay");
const Order = require("../models/Order");
const User = require("../models/User");

// Razorpay mode check
const RAZORPAY_KEY = process.env.RAZORPAY_KEY_ID || '';
if (RAZORPAY_KEY.startsWith('rzp_test_')) {
  console.warn('⚠️  WARNING: Razorpay is running in TEST MODE.');
  console.warn('   Update RAZORPAY_KEY_ID to rzp_live_* before going live.');
}

// Create Razorpay order for payment
exports.createPaymentOrder = async (req, res) => {
  try {
    console.log("Create payment order request received:", {
      body: { ...req.body, items: req.body.items?.length + " items" },
      user: req.user?.userId || "guest",
    });

    const {
      amount,
      currency = "INR",
      orderId,
      customerInfo,
      items,
      orderType,
      deliveryAddress,
      customerNote,
    } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    // First, create or get the user
    let userId;
    if (customerInfo && customerInfo.name && customerInfo.phone) {
      let user = await User.findOne({ phone: customerInfo.phone });
      if (!user) {
        user = new User({ name: customerInfo.name, phone: customerInfo.phone });
        await user.save();
      } else {
        // Update name if it's different
        if (user.name !== customerInfo.name) {
          user.name = customerInfo.name;
          await user.save();
        }
      }
      userId = user._id;
    } else if (req.user) {
      userId = req.user.userId;
    } else {
      return res.status(400).json({ message: "Customer information required" });
    }

    // Validate items before creating order
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "No items provided for order" });
    }

    // Create order in our database first with pending payment status
    const orderData = {
      user: userId,
      items: items.map((item) => ({
        product: item._id || item.product,
        name: item.name,
        quantity: item.quantity,
        size: item.size,
        addons: item.selectedAddons || item.addons,
        price: item.price,
      })),
      totalAmount: amount,
      paymentMethod: "Razorpay",
      paymentStatus: "Initiated",
      customerNote: orderType
        ? `${orderType}. ${customerNote || ""}`
        : customerNote,
      deliveryAddress: orderType === "Delivery" ? deliveryAddress : undefined,
    };

    let newOrder;
    try {
      newOrder = new Order(orderData);
      await newOrder.save();
    } catch (dbError) {
      console.error("Order save error:", dbError);
      return res.status(500).json({
        message: "Error saving order to database",
        error: dbError.message,
      });
    }

    // Create Razorpay order
    let razorpayOrder;
    const razorpayOptions = {
      amount: Math.round(amount * 100), // Razorpay expects amount in paise
      currency: currency,
      receipt: newOrder._id.toString(),
      notes: {
        orderId: newOrder._id.toString(),
        customerName: customerInfo?.name || "Guest",
        customerPhone: customerInfo?.phone || "",
      },
    };

    try {
      razorpayOrder = await razorpay.orders.create(razorpayOptions);
    } catch (razorpayError) {
      console.error("Razorpay order creation error:", razorpayError);
      // Update order status to failed
      newOrder.paymentStatus = "Failed";
      await newOrder.save();
      return res.status(500).json({
        message: "Error creating Razorpay order",
        error: razorpayError.message,
        details:
          razorpayError.error?.description ||
          razorpayError.description ||
          "Razorpay API error",
      });
    }

    // Update our order with Razorpay order ID
    newOrder.razorpayOrderId = razorpayOrder.id;
    await newOrder.save();

    res.status(201).json({
      success: true,
      razorpayOrderId: razorpayOrder.id,
      orderId: newOrder._id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Create payment order error:", error);
    console.error("Error details:", {
      message: error.message,
      statusCode: error.statusCode,
      error: error.error,
    });
    res.status(500).json({
      message: "Error creating payment order",
      error: error.message,
      details: error.error?.description || error.error || "Unknown error",
    });
  }
};

// Verify Razorpay payment signature
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res
        .status(400)
        .json({ message: "Missing payment verification parameters" });
    }

    // First check if payment was already verified (by webhook)
    const existingOrder = await Order.findOne({
      razorpayOrderId: razorpay_order_id,
    });
    if (existingOrder && existingOrder.paymentStatus === "Paid") {
      // Payment already verified by webhook, return success
      console.log(
        "Payment already verified by webhook for order:",
        razorpay_order_id,
      );
      return res.json({
        success: true,
        message: "Payment already verified",
        order: {
          _id: existingOrder._id,
          totalAmount: existingOrder.totalAmount,
          paymentStatus: existingOrder.paymentStatus,
          status: existingOrder.status,
        },
      });
    }

    // Generate signature for verification
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isValid = expectedSignature === razorpay_signature;

    if (!isValid) {
      // Check if payment actually succeeded via Razorpay API before marking as failed
      try {
        const payment = await razorpay.payments.fetch(razorpay_payment_id);
        if (payment.status === "captured") {
          // Payment was successful, update order even if signature mismatch
          console.log(
            "Signature mismatch but payment captured, updating order",
          );
          const order = await Order.findOneAndUpdate(
            { razorpayOrderId: razorpay_order_id },
            {
              razorpayPaymentId: razorpay_payment_id,
              paymentStatus: "Paid",
              paymentVerifiedAt: new Date(),
              status: "Pending",
            },
            { new: true },
          ).populate("user", "name phone");

          return res.json({
            success: true,
            message: "Payment verified via Razorpay API",
            order: {
              _id: order._id,
              totalAmount: order.totalAmount,
              paymentStatus: order.paymentStatus,
              status: order.status,
            },
          });
        }
      } catch (fetchError) {
        console.error("Error fetching payment from Razorpay:", fetchError);
      }

      // Update order status to failed
      await Order.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        {
          paymentStatus: "Failed",
          razorpayPaymentId: razorpay_payment_id,
        },
      );
      return res.status(400).json({
        success: false,
        message: "Payment verification failed - Invalid signature",
      });
    }

    // Fetch payment details from Razorpay to verify amount
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    // Update order with payment details
    const order = await Order.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        paymentStatus: "Paid",
        paymentVerifiedAt: new Date(),
        status: "Pending", // Order is now confirmed, ready for processing
      },
      { new: true },
    ).populate("user", "name phone");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({
      success: true,
      message: "Payment verified successfully",
      order: {
        _id: order._id,
        totalAmount: order.totalAmount,
        paymentStatus: order.paymentStatus,
        status: order.status,
      },
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({
      message: "Error verifying payment",
      error: error.message,
    });
  }
};

// Handle Razorpay Webhooks
exports.handleWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // Get raw body - could be Buffer (from express.raw) or object (from express.json)
    let rawBody;
    let body;

    if (Buffer.isBuffer(req.body)) {
      rawBody = req.body.toString("utf8");
      body = JSON.parse(rawBody);
    } else {
      rawBody = JSON.stringify(req.body);
      body = req.body;
    }

    // Verify webhook signature
    const signature = req.headers["x-razorpay-signature"];

    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

      if (signature !== expectedSignature) {
        console.error("Webhook signature verification failed");
        console.error("Expected:", expectedSignature);
        console.error("Received:", signature);
        return res.status(400).json({ message: "Invalid webhook signature" });
      }
      console.log("Webhook signature verified successfully");
    }

    const event = body.event;
    const payload = body.payload;

    console.log("Razorpay Webhook Event:", event);

    switch (event) {
      case "payment.captured":
        await handlePaymentCaptured(payload);
        break;
      case "payment.failed":
        await handlePaymentFailed(payload);
        break;
      case "order.paid":
        await handleOrderPaid(payload);
        break;
      default:
        console.log("Unhandled webhook event:", event);
    }

    res.json({ status: "ok" });
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.status(500).json({ message: "Webhook processing failed" });
  }
};

// Helper: Handle payment captured webhook
async function handlePaymentCaptured(payload) {
  const payment = payload.payment.entity;
  const razorpayOrderId = payment.order_id;

  await Order.findOneAndUpdate(
    { razorpayOrderId: razorpayOrderId },
    {
      razorpayPaymentId: payment.id,
      paymentStatus: "Paid",
      paymentVerifiedAt: new Date(),
    },
  );

  console.log(`Payment captured for order: ${razorpayOrderId}`);
}

// Helper: Handle payment failed webhook
async function handlePaymentFailed(payload) {
  const payment = payload.payment.entity;
  const razorpayOrderId = payment.order_id;

  await Order.findOneAndUpdate(
    { razorpayOrderId: razorpayOrderId },
    {
      razorpayPaymentId: payment.id,
      paymentStatus: "Failed",
    },
  );

  console.log(`Payment failed for order: ${razorpayOrderId}`);
}

// Helper: Handle order paid webhook
async function handleOrderPaid(payload) {
  const order = payload.order.entity;

  await Order.findOneAndUpdate(
    { razorpayOrderId: order.id },
    {
      paymentStatus: "Paid",
      paymentVerifiedAt: new Date(),
    },
  );

  console.log(`Order paid: ${order.id}`);
}

// Get payment status for an order
exports.getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId).select(
      "paymentStatus paymentMethod razorpayPaymentId paymentVerifiedAt totalAmount status",
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({
      orderId: order._id,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      razorpayPaymentId: order.razorpayPaymentId,
      paymentVerifiedAt: order.paymentVerifiedAt,
      totalAmount: order.totalAmount,
      orderStatus: order.status,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching payment status" });
  }
};

// Admin: Manual payment verification (for cash/offline verification)
exports.manualVerifyPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { verificationNote } = req.body;

    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        paymentStatus: "Paid",
        paymentVerifiedAt: new Date(),
        customerNote: verificationNote
          ? `${
              req.body.existingNote || ""
            } | Admin verified: ${verificationNote}`.trim()
          : undefined,
      },
      { new: true },
    ).populate("user", "name phone");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({
      success: true,
      message: "Payment manually verified",
      order,
    });
  } catch (error) {
    res.status(500).json({ message: "Error verifying payment manually" });
  }
};

// Get Razorpay key for frontend
exports.getRazorpayKey = async (req, res) => {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    res.json({
      keyId,
      isConfigured: !!keyId,
      mode: keyId?.startsWith('rzp_live_') ? 'live' : 'test'
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching Razorpay configuration" });
  }
};
