// ============================================
// src/app.js - FULLY FIXED
// ============================================

console.log('========================================');
console.log('🚀 STARTING SERVER INITIALIZATION');
console.log('========================================');
console.log('Time:', new Date().toISOString());
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
// MIDDLEWARE
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
// SIMPLE TEST ENDPOINTS
// ============================================

app.get('/', (req, res) => {
  console.log('📡 Root endpoint hit');
  res.json({ 
    success: true, 
    message: 'ZeroKoin API Server is running!',
    timestamp: new Date().toISOString()
  });
});

app.get('/ping', (req, res) => {
  console.log('📡 Ping endpoint hit');
  res.json({ success: true, message: 'pong', timestamp: new Date().toISOString() });
});

app.get('/health', (req, res) => {
  console.log('📡 Health check hit');
  res.json({ 
    success: true, 
    status: 'healthy',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/test', (req, res) => {
  console.log('📡 API test endpoint hit');
  res.json({ 
    success: true, 
    message: 'API is working!',
    timestamp: new Date().toISOString()
  });
});

console.log('✅ Test endpoints added');

// ============================================
// DATABASE CONNECTION
// ============================================
console.log('📦 Connecting to MongoDB...');

mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/zerokoin-admin")
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// ============================================
// ROUTES
// ============================================
console.log('📦 Mounting route handlers...');

app.use("/api/auth", authRoutes);
console.log('✅ Auth routes mounted');

app.use("/api/users", userRoutes);
console.log('✅ User routes mounted');

app.use("/api/courses", courseRoutes);
console.log('✅ Course routes mounted');

app.use("/api/pages", pageRoutes);
console.log('✅ Page routes mounted');

app.use("/api/admin", adminRoutes);
console.log('✅ Admin routes mounted');

app.use("/api/notifications", notificationRoutes);
console.log('✅ Notification routes mounted');

app.use("/api/transfer", transferRoutes);
console.log('✅ Transfer routes mounted');

app.use("/api/admob", admobRoutes);
console.log('✅ AdMob routes mounted');

app.use("/api/withdrawals", withdrawalRoutes);
console.log('✅ Withdrawal routes mounted');

// ============================================
// LEADERBOARD ENDPOINT
// ============================================
console.log('📊 Setting up leaderboard endpoint...');

app.get('/api/users/leaderboard/top10', async (req, res) => {
  try {
    console.log('📊 Leaderboard endpoint hit');
    
    const User = require('../models/user.model');
    
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

console.log('✅ Leaderboard endpoint added');

// ============================================
// DEBUG ROUTES
// ============================================
app.get('/debug-routes', (req, res) => {
  const routes = [];
  
  function extractRoutes(stack, basePath = '') {
    if (!stack) return;
    stack.forEach(layer => {
      if (layer.route) {
        const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
        routes.push({
          path: basePath + layer.route.path,
          methods: methods
        });
      } else if (layer.name === 'router' && layer.handle && layer.handle.stack) {
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
  
  if (app._router && app._router.stack) {
    extractRoutes(app._router.stack);
  }
  
  res.json({
    success: true,
    totalRoutes: routes.length,
    routes: routes.sort((a, b) => a.path.localeCompare(b.path))
  });
});

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
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log('========================================');
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log('========================================');
  console.log('📋 AVAILABLE ENDPOINTS:');
  console.log(`   GET  /                           - Root endpoint`);
  console.log(`   GET  /ping                       - Ping test`);
  console.log(`   GET  /health                     - Health check`);
  console.log(`   GET  /api/test                   - API test`);
  console.log(`   GET  /debug-routes               - List all routes`);
  console.log(`   GET  /api/users/leaderboard/top10 - Leaderboard`);
  console.log('========================================');
  console.log('✅ Server initialization complete');
  console.log('========================================');
});
