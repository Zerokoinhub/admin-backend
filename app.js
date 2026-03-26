const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

const admobRoutes = require("./routes/admob.routes");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const courseRoutes = require("./routes/course.routes");
const pageRoutes = require("./routes/page.routes");
const adminRoutes = require("./routes/admin.routes");
const notificationRoutes = require("./routes/notification.routes");
const transferRoutes = require("./routes/transfer.routes"); // ✅ NOW UNCOMMENTED
const withdrawalRoutes = require("./routes/withdrawal.routes");

const app = express();

// Middleware
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

// Database
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

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
// In src/app.js - add this after app.use("/api/users", userRoutes);

// ============ LEADERBOARD ENDPOINT ============
app.get('/api/users/leaderboard/top10', async (req, res) => {
  try {
    console.log('📊 Leaderboard endpoint hit');
    const User = require('../models/user.model');
    
    const topUsers = await User.find({ isActive: true, balance: { $gt: 0 } })
      .select('name username email balance profilePicture')
      .sort({ balance: -1 })
      .limit(10)
      .lean();
    
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
      error: error.message 
    });
  }
});

// Add a simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API is working!',
    timestamp: new Date().toISOString()
  });
});
app.use("/api/courses", courseRoutes);
app.use("/api/pages", pageRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/transfer", transferRoutes); // ✅ ENABLED
app.use("/api/admob", admobRoutes);
app.use("/api/withdrawals", withdrawalRoutes);
app.use('/api/courses', courseRoutes);
// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Start
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
