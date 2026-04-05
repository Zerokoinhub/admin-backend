const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

// ✅ Routes - correct paths since app.js is in src folder
const admobRoutes = require("./routes/admob.routes");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const courseRoutes = require("./routes/course.routes");
const pageRoutes = require("./routes/page.routes");
const adminRoutes = require("./routes/admin.routes");
const notificationRoutes = require("./routes/notification.routes");
const transferRoutes = require("./routes/transfer.routes");
const withdrawalRoutes = require("./routes/withdrawal.routes");

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
const allowedOrigins = [
  "https://admin.zerokoin.com",
  "https://admin-frontend-jet-eta.vercel.app",
  "http://localhost:3000",
  "http://localhost:3001",
  "https://admin.zerokoin.com/api/admob/oauth/callback",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log('❌ Blocked by CORS:', origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.options("*", cors());

app.use(helmet());
app.use(morgan("dev"));

// ============ DATABASE CONNECTION ============
mongoose
  .connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/zerokoin-admin",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ============ TEST ROUTES (ADD THESE FIRST) ============
app.get('/api/ping', (req, res) => {
  console.log('✅ PING received');
  res.json({ success: true, message: 'API is reachable', timestamp: new Date().toISOString() });
});

app.get('/api/test', (req, res) => {
  console.log('✅ TEST endpoint hit');
  res.json({ success: true, message: 'API is working properly' });
});

// ============ MAIN ROUTES ============
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/pages", pageRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/transfer", transferRoutes);
app.use("/api/admob", admobRoutes);
app.use("/api/withdrawals", withdrawalRoutes);

// ============ HEALTH CHECK ============
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// ============ 404 Handler for undefined routes ============
app.use((req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.url}`,
    path: req.url,
    method: req.method
  });
});

// ============ ERROR HANDLER ============
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// ============ START SERVER ============
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📡 Available endpoints:`);
  console.log(`   GET  /api/ping - Test API`);
  console.log(`   GET  /api/test - Test API`);
  console.log(`   GET  /health - Health check`);
  console.log(`   GET  /api/users - Get all users`);
  console.log(`   POST /api/users/sync - Sync user`);
  console.log(`   GET  /api/users/test - Test user routes`);
});
