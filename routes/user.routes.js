// Add this at the VERY TOP of user.routes.js
// This should always work if the file is loaded
// ============ TEST ENDPOINT - ADD THIS AT THE VERY TOP ============
// Add this temporary test endpoint at the top of your routes file
// Add this temporary debug endpoint
// Add this at the top of your routes, after the imports
router.get('/debug/all-users', async (req, res) => {
  try {
    const users = await User.find({}).select('name email firebaseUid uid balance isActive');
    console.log('📊 Total users in DB:', users.length);
    
    res.json({
      success: true,
      total: users.length,
      users: users
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
router.get('/debug/all-users', async (req, res) => {
  try {
    const users = await User.find({}).select('name email firebaseUid uid balance');
    console.log('📊 Total users in DB:', users.length);
    console.log('Users:', users.map(u => ({ name: u.name, email: u.email })));
    
    res.json({
      success: true,
      total: users.length,
      users: users
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
})
router.get('/debug/all-users', async (req, res) => {
  try {
    const allUsers = await User.find({}).select('name email uid createdAt');
    console.log('📊 Total users in DB:', allUsers.length);
    console.log('Users:', allUsers.map(u => ({ name: u.name, email: u.email, hasUid: !!u.uid })));
    
    res.json({
      success: true,
      total: allUsers.length,
      users: allUsers
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
router.get('/test-deploy', (req, res) => {
  console.log('✅ TEST-DEPLOY endpoint hit!');
  res.json({ 
    success: true, 
    message: 'NEW CODE IS DEPLOYED!',
    timestamp: new Date().toISOString(),
    route: '/api/users/test-deploy'
  });
});
router.get('/health-check', (req, res) => {
  console.log('✅ Health check route hit!');
  res.json({ 
    success: true, 
    message: 'User routes are loaded and working!',
    timestamp: new Date().toISOString()
  });
});

console.log('========================================');
console.log('🔧 USER ROUTES FILE IS BEING LOADED');
console.log('========================================');

const express = require("express")
const router = express.Router()
const userController = require("../controllers/user.controller")

console.log('✅ Controller loaded, functions:', Object.keys(userController));
console.log('========================================');
router.get('/test-connection', (req, res) => {
  console.log('✅ Test connection route hit!');
  res.json({
    success: true,
    message: 'User routes are working!',
    timestamp: new Date().toISOString()
  });
});
const express = require("express")
const router = express.Router()
const userController = require("../controllers/user.controller")
const { body } = require("express-validator")

// Validation middleware for user updates
const validateUserUpdate = [
  body("name").optional().trim().isLength({ min: 1 }).withMessage("Name cannot be empty"),
  body("email").optional().isEmail().withMessage("Please provide a valid email"),
  body("balance").optional().isNumeric().withMessage("Balance must be a number"),
  body("role").optional().isIn(["user", "admin", "moderator", "superadmin"]).withMessage("Invalid role"),
  body("calculatorUsage").optional().isInt({ min: 0 }).withMessage("Calculator usage must be a non-negative integer"),
  body("inviteCode").optional().trim(),
  body("referredBy").optional().trim(),
  body("isActive").optional().isBoolean().withMessage("isActive must be a boolean"),
  body("country").optional().trim().isLength({ min: 1 }).withMessage("Country cannot be empty"),
  body("walletStatus").optional().isIn(["Connected", "Not Connected", "Pending"]).withMessage("Invalid wallet status"),
  body("recentAmount").optional().isNumeric().withMessage("Recent amount must be a number"),
]

// Validation for session updates
const validateSessionUpdate = [
  body("sessionNumber").isInt({ min: 1, max: 4 }).withMessage("Session number must be between 1 and 4"),
  body("action").isIn(["unlock", "complete", "claim", "lock"]).withMessage("Invalid action"),
]

// Validation for notification settings
const validateNotificationSettings = [
  body("sessionUnlocked").optional().isBoolean().withMessage("sessionUnlocked must be a boolean"),
  body("pushEnabled").optional().isBoolean().withMessage("pushEnabled must be a boolean"),
]

// Validation for FCM token
const validateFcmToken = [body("token").notEmpty().withMessage("FCM token is required")]

// Validation for screenshot
const validateScreenshot = [
  body("screenshot").notEmpty().withMessage("Screenshot data is required"),
  body("screenshot.url").optional().isURL().withMessage("Screenshot URL must be valid"),
  body("screenshot.description").optional().trim(),
]

// Debug: Check if all controller functions exist
console.log("🔥 Available controller functions:", Object.keys(userController))

// ============ TEST ROUTES (Place FIRST - for debugging) ============
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'User routes are working properly' });
});

// ============ LEADERBOARD ROUTES (Place SECOND - before any :id routes) ============
console.log("🔥 Registering leaderboard routes...");

// Get top 10 users by balance
router.get('/leaderboard/top10', userController.getTopBalanceUsers)

// Get user's rank by balance
router.get('/leaderboard/rank/:userId', userController.getUserBalanceRank)

// Get paginated leaderboard (optional - for "view more" functionality)
router.get('/leaderboard/all', userController.getLeaderboardPaginated)

// ============ STATISTICS AND ANALYTICS ROUTES (Place THIRD) ============
// Get comprehensive user statistics
router.get("/stats/overview", userController.getUserStats)

// Get total referrals
router.get("/stats/referrals", userController.getTotalReferrals)

// Get total connected wallets
router.get("/stats/wallets", userController.getTotalConnectedWallets)

// Get total calculator usage
router.get("/stats/calculator-usage", userController.getTotalCalculatorUsage)

// ============ SPECIAL USER ROUTES (Place FOURTH - specific endpoints) ============
// Get all users (with pagination, search, filtering)
router.get("/", userController.getUsers)

// Get calculator users
router.get("/calculator-users", userController.getCalculatorUsers)

// Edit user balance (specific endpoint)
router.post("/edit-balance", userController.editUserBalance)

// ============ PARAMETERIZED ROUTES WITH PREFIXES (Place FIFTH) ============
// Get user sessions
router.get("/:id/sessions", userController.getUserSessions)

// Update user session (unlock, complete, claim, lock)
router.put("/:id/sessions", validateSessionUpdate, userController.updateUserSession)

// Update notification settings
router.put("/:id/notifications", validateNotificationSettings, userController.updateNotificationSettings)

// FCM token management
router.post("/:id/fcm-token", validateFcmToken, userController.addFcmToken)
router.delete("/:id/fcm-token", validateFcmToken, userController.removeFcmToken)

// Screenshot management
router.get("/:userId/screenshots", userController.getUserScreenshots);
router.post("/:id/screenshots", validateScreenshot, userController.addScreenshot)

// Ban user
router.put("/:id/ban", userController.banUser)

// Unban user
router.put("/:id/unban", userController.unbanUser)

// Manual coin transfer
router.post("/:id/transfer", userController.manualCoinTransfer)

// ============ GENERIC USER BY ID ROUTES (Place LAST - most generic) ============
// Update any user (admin function) - THIS MUST COME AFTER ALL OTHER :id ROUTES
router.put("/:id", validateUserUpdate, userController.updateUser)

// Get user by ID - if you have this endpoint, add it here
// router.get("/:id", userController.getUserById)

// ============ AUTHENTICATION ROUTES (commented out - uncomment when auth middleware is available) ============
// Change password
// router.put("/change-password", auth, userController.changePassword)

// Protected profile routes
// router.get("/profile", auth, userController.getProfile)
// router.put("/profile", auth, userController.updateProfile)

// Protected admin routes (commented out)
// router.put("/:id", auth, validateUserUpdate, userController.updateUser)
// router.put("/:id/ban", auth, userController.banUser)
// router.put("/:id/unban", auth, userController.unbanUser)
// router.post("/:id/transfer", auth, userController.manualCoinTransfer)
// ============ SYNC ROUTE (Add this BEFORE parameterized routes) ============
// Sync Firebase user to MongoDB
router.post('/sync', userController.syncFirebaseUser);
// router.post("/edit-balance", auth, userController.editUserBalance)
// router.put("/:id/sessions", auth, validateSessionUpdate, userController.updateUserSession)
// router.put("/:id/notifications", auth, validateNotificationSettings, userController.updateNotificationSettings)
// router.post("/:id/fcm-token", auth, validateFcmToken, userController.addFcmToken)
// router.delete("/:id/fcm-token", auth, validateFcmToken, userController.removeFcmToken)
// router.post("/:id/screenshots", auth, validateScreenshot, userController.addScreenshot)

module.exports = router
