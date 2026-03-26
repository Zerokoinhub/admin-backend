// ============================================
// src/app.js - FULLY FIXED WITH DEBUG LOGS
// ============================================

console.log('========================================');
console.log('🚀 STARTING SERVER INITIALIZATION');
console.log('========================================');
console.log('Current time:', new Date().toISOString());
console.log('Node version:', process.version);
console.log('Working directory:', process.cwd());
console.log('========================================');

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

console.log('✅ Dependencies loaded');

const admobRoutes = require("./routes/admob.routes");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const courseRoutes = require("./routes/course.routes");
const pageRoutes = require("./routes/page.routes");
const adminRoutes = require("./routes/admin.routes");
const notificationRoutes = require("./routes/notification.routes");
const transferRoutes = require("./routes/transfer.routes");
const withdrawalRoutes = require("./routes/withdrawal.routes");

console.log('✅ Route files loaded');

const app = express();
console.log('✅ Express app created');

// ============================================
// BASIC MIDDLEWARE
// ============================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.options("*", cors());

app.use(helmet());
app.use(morgan("dev"));

console.log('✅ Middleware configured');

// ============================================
// SIMPLE TEST ROUTES - MUST WORK
// ============================================

// Root endpoint
app.get('/', (req, res) => {
  console.log('📡 Root endpoint hit');
  res.json({ 
    success: true, 
    message: 'Server is running!',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      test: '/api/test',
      ping: '/ping',
      leaderboard: '/api/users/leaderboard/top10'
    }
  });
});

// Ping endpoint
app.get('/ping', (req, res) => {
  console.log('📡 Ping endpoint hit');
  res.json({ success: true, message: 'pong', timestamp: new Date().toISOString() });
});

// Health check
app.get("/health", (req, res) => {
  console.log('📡 Health check hit');
  res.status(200).json({
    success: true,
    status: "healthy",
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  console.log('📡 API test endpoint hit');
  res.json({ 
    success: true, 
    message: 'API is working!',
    timestamp: new Date().toISOString()
  });
});

console.log('✅ Basic test routes added');

// ============================================
// DATABASE CONNECTION
// ============================================
console.log('📦 Connecting to MongoDB...');

mongoose
  .connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/zerokoin-admin",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// ============================================
// REGULAR ROUTES
// ============================================
console.log('📦 Mounting route handlers...');

app.use("/api/auth", authRoutes);
console.log('✅ Auth routes mounted at /api/auth');

app.use("/api/users", userRoutes);
console.log('✅ User routes mounted at /api/users');

app.use("/api/courses", courseRoutes);
console.log('✅ Course routes mounted at /api/courses');

app.use("/api/pages", pageRoutes);
console.log('✅ Page routes mounted at /api/pages');

app.use("/api/admin", adminRoutes);
console.log('✅ Admin routes mounted at /api/admin');

app.use("/api/notifications", notificationRoutes);
console.log('✅ Notification routes mounted at /api/notifications');

app.use("/api/transfer", transferRoutes);
console.log('✅ Transfer routes mounted at /api/transfer');

app.use("/api/admob", admobRoutes);
console.log('✅ AdMob routes mounted at /api/admob');

app.use("/api/withdrawals", withdrawalRoutes);
console.log('✅ Withdrawal routes mounted at /api/withdrawals');

// ============================================
// LEADERBOARD ENDPOINT - DIRECT IN APP.JS
// ============================================
console.log('📊 Setting up leaderboard endpoint...');

app.get('/api/users/leaderboard/top10', async (req, res) => {
  try {
    console.log('📊 Leaderboard endpoint hit!');
    
    // Dynamically require User model
    const User = require('../models/user.model');
    console.log('✅ User model loaded for leaderboard');
    
    const topUsers = await User.find({ isActive: true, balance: { $gt: 0 } })
      .select('name username email balance profilePicture')
      .sort({ balance: -1 })
      .limit(10)
      .lean();
    
    console.log(`✅ Found ${topUsers.length} users with balances`);
    
    const formattedUsers = topUsers.map((user, index) => ({
      rank: index + 1,
      id: user._id,
      name: user.name || user.username || 'Anonymous User',
      email: user.email,
      balance: user.balance || 0,
      profilePicture: user.profilePicture || null,
      username: user.username || ''
    }));
    
    const totalUsers = await User.countDocuments({ isActive: true, balance: { $gt: 0 } });
    
    res.json({
      success: true,
      data: {
        topUsers: formattedUsers,
        stats: {
          totalUsersWithBalance: totalUsers,
          averageBalance: 0,
          highestBalance: formattedUsers[0]?.balance || 0,
          lastUpdated: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    console.error('❌ Leaderboard error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching leaderboard',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

console.log('✅ Leaderboard endpoint added at /api/users/leaderboard/top10');

// ============================================
// DEBUG ENDPOINT - LIST ALL ROUTES
// ============================================
app.get('/debug-routes', (req, res) => {
  const routes = [];
  
  function extractRoutes(stack, basePath = '') {
    stack.forEach(layer => {
      if (layer.route) {
        const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
        routes.push({
          path: basePath + layer.route.path,
          methods: methods
        });
      } else if (layer.name === 'router' && layer.handle.stack) {
        let routerPath = '';
        if (layer.regexp) {
          const pathStr = layer.regexp.toString();
          const match = pathStr.match(/\/\^?(.*?)\\\/\?/);
          if (match && match[1]) {
            routerPath = '/' + match[1].replace(/\\/g, '');
          }
        }
        extractRoutes(layer.handle.stack, basePath + routerPath);
      }
    });
  }
  
  extractRoutes(app._router.stack);
  
  res.json({
    success: true,
    totalRoutes: routes.length,
    routes: routes.sort((a, b) => a.path.localeCompare(b.path))
  });
});

console.log('✅ Debug routes added');

// ============================================
// ERROR HANDLER
// ============================================
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log('========================================');
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📡 Base URL: http://localhost:${PORT}`);
  console.log('========================================');
  console.log('📋 AVAILABLE ENDPOINTS:');
  console.log(`   GET  /                 - Root endpoint`);
  console.log(`   GET  /ping             - Ping test`);
  console.log(`   GET  /health           - Health check`);
  console.log(`   GET  /api/test         - API test`);
  console.log(`   GET  /debug-routes     - List all routes`);
  console.log(`   GET  /api/users/leaderboard/top10 - Leaderboard`);
  console.log('========================================');
  console.log('✅ Server initialization complete');
  console.log('========================================');
});
