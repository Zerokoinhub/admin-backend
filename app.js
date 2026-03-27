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
  "http://localhost:8080",
  "https://zerokoinapp-production.up.railway.app"
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log(`⚠️ CORS blocked origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);
app.options("*", cors());

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
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
    timestamp: new Date().toISOString(),
    version: '1.0.0'
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
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
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
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/zerokoin-admin", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('✅ Connected to MongoDB');
    console.log('📊 Database name:', mongoose.connection.db.databaseName);
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// ============================================
// SYNC FIREBASE USER TO MONGODB
// ============================================
app.post('/api/users/sync', async (req, res) => {
  console.log('🔄 SYNC endpoint hit!');
  console.log('Headers:', {
    authorization: req.headers.authorization ? 'Present' : 'Missing',
    'content-type': req.headers['content-type']
  });
  console.log('Body:', req.body);
  
  try {
    const { uid, email, name, photoURL } = req.body;
    
    if (!uid || !email) {
      console.log('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: uid and email are required'
      });
    }
    
    console.log(`🔄 Syncing user: ${email} (UID: ${uid})`);
    
    const User = require('../models/user.model');
    const crypto = require('crypto');
    
    // Check if user exists by uid or email
    let user = await User.findOne({ 
      $or: [{ uid: uid }, { email: email }] 
    });
    
    if (!user) {
      // Create new user
      const username = name ? name.toLowerCase().replace(/\s/g, '').substring(0, 20) : email.split('@')[0];
      const inviteCode = crypto.randomBytes(16).toString('hex');
      
      user = new User({
        uid: uid,
        email: email,
        name: name || email.split('@')[0],
        username: username,
        photoURL: photoURL || '',
        balance: 0,
        recentAmount: 0,
        isActive: true,
        role: 'user',
        inviteCode: inviteCode,
        lastLogin: new Date(),
        sessions: [
          { sessionNumber: 1, isLocked: false },
          { sessionNumber: 2, isLocked: true },
          { sessionNumber: 3, isLocked: true },
          { sessionNumber: 4, isLocked: true }
        ],
        walletAddresses: {
          metamask: '',
          trustWallet: ''
        },
        notificationSettings: {
          sessionUnlocked: true,
          pushEnabled: true
        }
      });
      
      await user.save();
      console.log(`✅ New user created: ${email} (UID: ${uid})`);
      console.log(`📊 Total users now: ${await User.countDocuments()}`);
    } else {
      // Update existing user
      let updated = false;
      
      if (!user.uid && uid) {
        user.uid = uid;
        updated = true;
      }
      if (name && user.name !== name) {
        user.name = name;
        updated = true;
      }
      if (photoURL && user.photoURL !== photoURL) {
        user.photoURL = photoURL;
        updated = true;
      }
      
      user.lastLogin = new Date();
      updated = true;
      
      if (updated) {
        await user.save();
        console.log(`✅ User updated: ${email}`);
      } else {
        console.log(`📝 User already synced: ${email}`);
      }
    }
    
    // Clear cache if you have one
    if (global.cache) {
      global.cache.clear();
    }
    
    res.json({
      success: true,
      message: 'User synced successfully',
      user: {
        id: user._id,
        uid: user.uid,
        email: user.email,
        name: user.name,
        username: user.username,
        balance: user.balance,
        isActive: user.isActive,
        role: user.role,
        photoURL: user.photoURL,
        inviteCode: user.inviteCode
      }
    });
    
  } catch (error) {
    console.error('❌ Error syncing user:', error);
    res.status(500).json({
      success: false,
      message: 'Error syncing user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================
// DEBUG ENDPOINT - SEE ALL USERS
// ============================================
app.get('/api/users/all', async (req, res) => {
  try {
    const User = require('../models/user.model');
    const users = await User.find({})
      .select('uid email name username balance isActive role createdAt lastLogin')
      .sort({ createdAt: -1 });
    
    console.log(`📊 Total users in MongoDB: ${users.length}`);
    
    res.json({
      success: true,
      count: users.length,
      users: users.map(u => ({
        id: u._id,
        uid: u.uid,
        email: u.email,
        name: u.name,
        username: u.username,
        balance: u.balance,
        isActive: u.isActive,
        role: u.role,
        createdAt: u.createdAt,
        lastLogin: u.lastLogin
      }))
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// LEADERBOARD ENDPOINT
// ============================================
app.get('/api/users/leaderboard/top10', async (req, res) => {
  try {
    console.log('📊 Leaderboard endpoint hit');
    
    const User = require('../models/user.model');
    
    const topUsers = await User.find({ 
      isActive: true, 
      balance: { $gt: 0 } 
    })
      .select('name username email balance profilePicture photoURL country')
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
      profilePicture: user.profilePicture || user.photoURL || null,
      country: user.country || 'Unknown',
      username: user.username || ''
    }));
    
    const totalUsers = await User.countDocuments({ 
      isActive: true, 
      balance: { $gt: 0 } 
    });
    
    // Get average balance
    const avgResult = await User.aggregate([
      { $match: { isActive: true, balance: { $gt: 0 } } },
      { $group: { _id: null, avgBalance: { $avg: "$balance" } } }
    ]);
    const avgBalance = avgResult[0]?.avgBalance || 0;
    
    res.json({
      success: true,
      data: {
        topUsers: formattedUsers,
        stats: {
          totalUsersWithBalance: totalUsers,
          averageBalance: Math.round(avgBalance * 100) / 100,
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

// ============================================
// USER ROUTES MOUNT
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
// DEBUG ROUTES - LIST ALL REGISTERED ROUTES
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
// 404 HANDLER
// ============================================
app.use((req, res) => {
  console.log(`⚠️ 404 - Route not found: ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    message: `Route ${req.url} not found`,
    method: req.method,
    availableEndpoints: {
      root: '/',
      health: '/health',
      ping: '/ping',
      api: '/api/test',
      users: '/api/users',
      leaderboard: '/api/users/leaderboard/top10',
      sync: '/api/users/sync',
      allUsers: '/api/users/all',
      debugRoutes: '/debug-routes'
    }
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
  console.log(`   POST /api/users/sync             - Sync Firebase user`);
  console.log(`   GET  /api/users/all              - Get all users`);
  console.log(`   GET  /api/users/leaderboard/top10 - Leaderboard`);
  console.log(`   GET  /api/users/                 - Get users (paginated)`);
  console.log('========================================');
  console.log('✅ Server initialization complete');
  console.log('========================================');
});

module.exports = app;
