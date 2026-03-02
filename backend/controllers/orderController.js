const Order = require("../models/Order");
const User = require("../models/User");

// Create order (for customers - can be guest or logged in)
exports.createOrder = async (req, res) => {
  try {
    const {
      user,
      items,
      totalAmount,
      paymentMethod,
      orderType,
      customerNote,
      deliveryAddress,
      donationAmount,
      appliedOffer,
      deliveryFee,
      platformFee,
      taxAmount,
    } = req.body;

    const order = new Order({
      user: req.user ? req.user.userId : user,
      items,
      totalAmount,
      paymentMethod: paymentMethod || "Cash",
      orderType: orderType || "Dine-in",
      customerNote,
      deliveryAddress,
      donationAmount: donationAmount || 0,
      appliedOffer,
      deliveryFee: deliveryFee || 0,
      platformFee: platformFee || 0,
      taxAmount: taxAmount || 0,
    });
    await order.save();
    res.status(201).json(order);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating order", error: error.message });
  }
};

// Track order status (Public - uses order ID as capability token)
exports.trackOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .select(
        "status isAccepted acceptedAt createdAt paymentMethod paymentStatus paymentScreenshot totalAmount items orderType deliveryAddress donationAmount appliedOffer deliveryFee platformFee taxAmount",
      )
      .populate("items.product", "name image");
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Error tracking order" });
  }
};

exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.userId }).sort({
      createdAt: -1,
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error fetching orders" });
  }
};

// Admin: Get all orders
exports.getAllOrders = async (req, res) => {
  try {
    // Exclude orders where payment was initiated but not completed (Razorpay pending)
    // Show orders that are: Cash orders (any status) OR Razorpay with Paid/Failed status
    const orders = await Order.find({
      $or: [
        { paymentMethod: "Cash" },
        { paymentMethod: { $ne: "Razorpay" } },
        {
          paymentMethod: "Razorpay",
          paymentStatus: { $in: ["Paid", "Failed", "Refunded"] },
        },
      ],
    })
      .populate("user", "name phone")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error fetching all orders" });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true },
    ).populate("user", "name phone");
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Error updating order status" });
  }
};

// Admin: Accept order
exports.acceptOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        isAccepted: true,
        acceptedAt: new Date(),
        status: "Preparing", // Auto-move to Preparing when accepted
      },
      { new: true },
    ).populate("user", "name phone");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error accepting order", error: error.message });
  }
};

// Cancel order (within 30 seconds)
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if order is already accepted
    if (order.isAccepted) {
      return res
        .status(400)
        .json({ message: "Order already accepted, cannot cancel" });
    }

    // Check if within 30 second window
    const timeSinceOrder = Date.now() - new Date(order.createdAt).getTime();
    const thirtySeconds = 30 * 1000;

    if (timeSinceOrder > thirtySeconds) {
      return res.status(400).json({ message: "Cancellation window expired" });
    }

    // Update order status to Cancelled
    order.status = "Cancelled";
    await order.save();

    res.json({ message: "Order cancelled successfully", order });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error cancelling order", error: error.message });
  }
};

// Upload payment screenshot (for UPI manual verification)
exports.uploadPaymentScreenshot = async (req, res) => {
  try {
    const { screenshotUrl } = req.body;

    if (!screenshotUrl) {
      return res.status(400).json({ message: "Screenshot URL is required" });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        paymentScreenshot: {
          url: screenshotUrl,
          uploadedAt: new Date(),
          verified: false,
        },
        paymentStatus: "Initiated", // Mark as initiated once screenshot is uploaded
      },
      { new: true },
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ message: "Payment screenshot uploaded successfully", order });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error uploading screenshot", error: error.message });
  }
};

// Admin: Verify payment screenshot
exports.verifyPaymentScreenshot = async (req, res) => {
  try {
    const { verified } = req.body;
    const adminName = req.user?.name || "Admin";

    const updateData = {
      "paymentScreenshot.verified": verified,
      "paymentScreenshot.verifiedAt": new Date(),
      "paymentScreenshot.verifiedBy": adminName,
    };

    // If verified, also update payment status
    if (verified) {
      updateData.paymentStatus = "Paid";
    }

    const order = await Order.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    }).populate("user", "name phone");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({
      message: verified
        ? "Payment verified successfully"
        : "Payment marked as unverified",
      order,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error verifying payment", error: error.message });
  }
};
