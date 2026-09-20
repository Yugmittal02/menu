const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === "production";

if (isProduction) {
  app.set("trust proxy", 1);
}

// ===================
// CORS
// ===================
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : [];

const defaultAllowedOrigins = [
  "https://orderly.menu.krixov.com",
  "https://sewashubhambakery.com",
  "https://www.sewashubhambakery.com",
  ...(isProduction ? [] : ["http://localhost:5173", "http://localhost:3000"]),
];

const allAllowedOrigins = [
  ...new Set([...allowedOrigins, ...defaultAllowedOrigins]),
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (!isProduction) return callback(null, true);
      if (allAllowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
  })
);

// ===================
// SECURITY
// ===================
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 5000 : 99999,
  message: { message: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", limiter);

// Body parser with raw body capture for webhook HMAC signature verification
app.use(
  express.json({
    limit: "10mb",
    verify: (req, res, buf) => {
      req.rawBody = buf.toString("utf8");
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// NoSQL injection prevention
const sanitizeObject = (obj) => {
  if (obj && typeof obj === "object") {
    for (const key in obj) {
      if (key.startsWith("$") || key.includes(".")) {
        delete obj[key];
      } else if (typeof obj[key] === "object") {
        sanitizeObject(obj[key]);
      }
    }
  }
};
app.use((req, res, next) => {
  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);
  next();
});

app.use(hpp());

// ===================
// DATABASE
// ===================
const requiredEnvVars = ["MONGODB_URI", "JWT_SECRET"];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

const User = require("./models/User");

const seedInitialData = async () => {
  try {
    const existingAdmin = await User.findOne({ role: "superadmin" });
    if (!existingAdmin) {
      const admin = new User({
        name: "Super Admin",
        email: "yugmittal689@gmail.com",
        password: "Yugmittal@22",
        role: "superadmin",
      });
      await admin.save();
      console.log("✅ SuperAdmin seeded successfully!");
      console.log("   Email: yugmittal689@gmail.com");
      console.log("   Password: Yugmittal@22");
    }

    // Seed default cafes and sample menu items if empty
    const Cafe = require("./models/Cafe");
    const MenuItem = require("./models/MenuItem");
    const cafeCount = await Cafe.countDocuments();
    if (cafeCount === 0) {
      const offlineStore = require("./utils/offlineStore");
      const offlineCafes = offlineStore.getCafes ? offlineStore.getCafes() : [];
      for (const c of offlineCafes) {
        const newCafe = new Cafe({
          cafeId: c.cafeId,
          name: c.name,
          ownerName: c.ownerName,
          phone: c.phone,
          email: c.email || '',
          address: c.address || '',
          city: c.city || '',
          tableCount: c.tableCount || 10,
          openTime: c.openTime || '10:00',
          closeTime: c.closeTime || '23:00',
          theme: 'classic-dark',
          isActive: true,
          taxPercent: 5,
          taxLabel: 'GST',
          kotPrefix: 'KOT',
          invoicePrefix: 'INV',
          footerText: 'Thank you for dining with us! Please visit again.'
        });
        await newCafe.save();

        const sampleItems = [
          { name: 'Espresso Romano', category: 'Beverages', price: 180, isVeg: true, isAvailable: true },
          { name: 'Cold Brew Float', category: 'Beverages', price: 240, isVeg: true, isAvailable: true },
          { name: 'Truffle Parmesan Fries', category: 'Snacks', price: 260, isVeg: true, isAvailable: true },
          { name: 'Paneer Tikka Panini', category: 'Main Course', price: 340, isVeg: true, isAvailable: true },
          { name: 'Grilled Chicken Ciabatta', category: 'Main Course', price: 380, isVeg: false, isAvailable: true },
          { name: 'Artisan Sourdough Pizza', category: 'Main Course', price: 450, isVeg: true, isAvailable: true },
          { name: 'Classic Tiramisu', category: 'Desserts', price: 290, isVeg: true, isAvailable: true }
        ];
        for (const it of sampleItems) {
          await new MenuItem({ ...it, cafe: newCafe._id }).save();
        }
      }
      console.log("✅ Initial cafes and sample menu items seeded successfully!");
    }
  } catch (err) {
    console.error("⚠️ Error seeding initial data:", err.message);
  }
};

const connectWithTimeout = (uri, options = {}, timeoutMs = 3000) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`MongoDB connection timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    mongoose.connect(uri, options).then(
      (res) => {
        clearTimeout(timer);
        resolve(res);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
};

const connectDatabase = async () => {
  try {
    console.log("⏳ Connecting to Primary MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log("✅ MongoDB Connected (Atlas)");
    await seedInitialData();
  } catch (err) {
    console.warn("⚠️ Primary MongoDB unreachable:", err.message);
    console.log("ℹ️ Offline mode: Activated persistent local store.");
    console.log("✅ SuperAdmin, Applications, POS, Sessions, and Cafe management fully operational locally!");
  }
};

mongoose.connection.on("error", (err) => {
  console.warn("⚠️ Mongoose connection error (handled):", err.message);
});

mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ Mongoose disconnected from MongoDB");
});

process.on("uncaughtException", (err) => {
  console.error("⚠️ Process caught uncaughtException:", err.message);
});

process.on("unhandledRejection", (reason) => {
  console.error("⚠️ Process caught unhandledRejection:", reason);
});

mongoose.set('bufferTimeoutMS', 2500);
connectDatabase();

// ===================
// ROUTES
// ===================
app.use("/api/auth", require("./routes/auth"));
app.use("/api/cafes", require("./routes/cafes"));
app.use("/api/menu", require("./routes/menu"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/coupons", require("./routes/coupons"));
app.use("/api/upload", require("./routes/upload"));
app.use("/api/applications", require("./routes/applications"));
app.use("/api/sessions", require("./routes/sessions"));
app.use("/api/pos", require("./routes/pos"));
app.use("/api/reservations", require("./routes/reservations"));
app.use("/api/staff", require("./routes/staff"));
app.use("/api/customers", require("./routes/customers"));
app.use("/api/inventory", require("./routes/inventory"));
app.use("/api/support", require("./routes/support"));
app.use("/api/payments", require("./routes/payments"));
app.use("/api/webhooks", require("./routes/webhooks"));
app.use("/api/admin/payments", require("./routes/adminPayments"));

// Health check
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "QR Menu Ordering System API",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "healthy" });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "healthy" });
});

// ===================
// ERROR HANDLING
// ===================
app.use((req, res, next) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  if (!isProduction) console.error("Error:", err);

  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ message: "CORS: Origin not allowed" });
  }
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: messages.join(", ") });
  }
  if (err.code === 11000) {
    return res.status(400).json({ message: "Duplicate entry found" });
  }
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ message: "Invalid token" });
  }
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ message: "Token expired" });
  }

  res.status(err.status || 500).json({
    message: isProduction ? "Something went wrong" : err.message,
  });
});

// ===================
// SERVER
// ===================
let server;
if (process.env.NODE_ENV !== "test") {
  server = app.listen(PORT, () => {
    console.log(`🚀 QR Menu Server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
  });

  process.on("SIGTERM", () => {
    console.log("SIGTERM received. Shutting down...");
    server.close(() => {
      mongoose.connection.close(false, () => {
        process.exit(0);
      });
    });
  });
}

module.exports = app;
