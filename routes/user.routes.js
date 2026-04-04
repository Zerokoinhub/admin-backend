const express = require("express")
const router = express.Router()
const userController = require("../controllers/user.controller")
const { body } = require("express-validator")

console.log('========================================');
console.log('🔧 USER ROUTES FILE IS BEING LOADED');
console.log('========================================');
console.log('✅ Controller loaded, functions:', Object.keys(userController));
console.log('========================================');

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

// ============ TEST ROUTES (Place FIRST - for debugging) ============
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'User routes are working properly' });
});

router.get('/test-connection', (req, res) => {
  console.log('✅ Test connection route hit!');
  res.json({
    success: true,
    message: 'User routes are working!',
    timestamp: new Date().toISOString()
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

// ============ DEBUG ENDPOINT ============
router.get('/debug/all-users', async (req, res) => {
  try {
    const User = require("../models/user.model");
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

// ============ MAIN GET USERS ROUTE ============
router.get("/", userController.getUsers);

// ============ SYNC ROUTE ============
router.post('/sync', userController.syncFirebaseUser);

// ============ LEADERBOARD ROUTES ============
router.get('/leaderboard/top10', userController.getTopBalanceUsers)
router.get('/leaderboard/rank/:userId', userController.getUserBalanceRank)
router.get('/leaderboard/all', userController.getLeaderboardPaginated)

// ============ STATISTICS AND ANALYTICS ROUTES ============
router.get("/stats/overview", userController.getUserStats)
router.get("/stats/referrals", userController.getTotalReferrals)
router.get("/stats/wallets", userController.getTotalConnectedWallets)
router.get("/stats/calculator-usage", userController.getTotalCalculatorUsage)

// ============ SPECIAL USER ROUTES ============
router.get("/calculator-users", userController.getCalculatorUsers)
router.post("/edit-balance", userController.editUserBalance)

// ============ PARAMETERIZED ROUTES WITH PREFIXES ============
router.get("/:id/sessions", userController.getUserSessions)
router.put("/:id/sessions", validateSessionUpdate, userController.updateUserSession)
router.put("/:id/notifications", validateNotificationSettings, userController.updateNotificationSettings)
router.post("/:id/fcm-token", validateFcmToken, userController.addFcmToken)
router.delete("/:id/fcm-token", validateFcmToken, userController.removeFcmToken)
router.get("/:userId/screenshots", userController.getUserScreenshots);
router.post("/:id/screenshots", validateScreenshot, userController.addScreenshot)
router.put("/:id/ban", userController.banUser)
router.put("/:id/unban", userController.unbanUser)
router.post("/:id/transfer", userController.manualCoinTransfer)

// ============ GENERIC USER BY ID ROUTES (Place LAST) ============
router.put("/:id", validateUserUpdate, userController.updateUser)

module.exports = router
