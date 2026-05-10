const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

// Routes
const admobRoutes = require("../routes/admob.routes");
const authRoutes = require("../routes/auth.routes");
const userRoutes = require("../routes/user.routes");
const courseRoutes = require("../routes/course.routes");
const pageRoutes = require("../routes/page.routes");
const adminRoutes = require("../routes/admin.routes");
const notificationRoutes = require("../routes/notification.routes");
const transferRoutes = require("../routes/transfer.routes");
const withdrawalRoutes = require("../routes/withdrawal.routes");

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============ CORS CONFIGURATION ============
const allowedOrigins = [
  "https://admin.zerokoin.com",
  "https://admin-frontend-jet-eta.vercel.app",
  "http://localhost:3000",
  "http://localhost:3001",
  "https://admin.zerokoin.com/api/admob/oauth/callback",
  "https://admin-backend-production-4ff2.up.railway.app",
  "https://zerokoinapp-production.up.railway.app",
  "https://zerokoin.com",
  "http://localhost:3002"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log('❌ Blocked by CORS:', origin);
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['Content-Length', 'X-Requested-With'],
    preflightContinue: false,
    optionsSuccessStatus: 204
  })
);

app.options('*', cors());

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Security and logging
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(morgan("dev"));

// Database connection
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

// ============ TEST ENDPOINTS ============
app.get('/api/ping', (req, res) => {
  console.log('✅ PING received from:', req.headers.origin);
  res.json({ success: true, message: 'API is reachable', timestamp: new Date().toISOString() });
});

app.get('/api/test', (req, res) => {
  console.log('✅ TEST endpoint hit from:', req.headers.origin);
  res.json({ success: true, message: 'API is working properly' });
});

app.get('/api/cors-test', (req, res) => {
  console.log('✅ CORS test from:', req.headers.origin);
  res.json({ 
    success: true, 
    message: 'CORS is working!',
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
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

// ============ ✅ NEW - DEDUCT SCREENSHOT COINS ROUTE ============
app.post('/api/users/deduct-screenshot-coins', async (req, res) => {
  try {
    const { email, amount, admin } = req.body;
    
    console.log("📤 Deduct request:", { email, amount, admin });
    
    if (!email || !amount) {
      return res.status(400).json({ error: 'Email and amount required' });
    }

    const User = require('../models/User');
    const user = await User.findOne({ email: email });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const currentBalance = user.balance || 0;
    const newBalance = currentBalance - amount;
    
    if (newBalance < 0) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    
    // Update balance directly
    user.balance = newBalance;
    user.updatedAt = new Date();
    await user.save();
    
    // Try to record transaction (optional)
    try {
      const Transfer = require('../models/Transfer');
      const transfer = new Transfer({
        email: email,
        userName: user.name,
        amount: -amount,
        adminName: admin || 'System',
        reason: 'Screenshot approval revoked',
        status: 'completed',
        createdAt: new Date()
      });
      await transfer.save();
    } catch (err) {
      console.log("Transfer record not saved (optional)");
    }

    console.log("✅ Deduct successful:", { email, newBalance });
    
    return res.status(200).json({ 
      success: true, 
      newBalance: newBalance,
      message: `${amount} coins deducted successfully`
    });
  } catch (error) {
    console.error('Error in deduct-screenshot-coins:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// ============ USER ENDPOINTS (Direct for testing) ============
app.get('/api/users/all', async (req, res) => {
  try {
    const User = require('../models/User');
    const users = await User.find({}).select('email name balance isActive role');
    console.log(`📊 Total users: ${users.length}`);
    res.json({ success: true, count: users.length, users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const { page = 1, limit = 100 } = req.query;
    const User = require('../models/User');
    
    const users = await User.find({})
      .select('email name balance isActive role photoURL createdAt screenshots screenshotsApproved')
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await User.countDocuments();
    
    res.json({ 
      success: true, 
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalUsers: total
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ 404 HANDLER ============
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
  console.log(`\n🚀 Admin Backend Server is running on port ${PORT}`);
  console.log(`📡 Available endpoints:`);
  console.log(`   GET  /api/ping - Test API`);
  console.log(`   GET  /api/test - Test API`);
  console.log(`   GET  /api/cors-test - CORS Test`);
  console.log(`   GET  /health - Health check`);
  console.log(`   GET  /api/users - Get all users (paginated)`);
  console.log(`   GET  /api/users/all - Get all users`);
  console.log(`   POST /api/users/deduct-screenshot-coins - Deduct coins for unapprove`);
  console.log(`   GET  /api/courses - Get all courses`);
  console.log(`   POST /api/users/sync - Sync user`);
  console.log(`\n✅ CORS Allowed Origins:`);
  allowedOrigins.forEach(origin => console.log(`   - ${origin}`));
  console.log(`\n🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS Mode: Production (restricted)`);
});
