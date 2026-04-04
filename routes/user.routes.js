const express = require("express")
const router = express.Router()
const userController = require("../controllers/user.controller")

console.log('🚀 USER ROUTES FILE LOADED');

// ============ TEST ROUTES (FIRST) ============
router.get('/test', (req, res) => {
  console.log('✅ User test route hit');
  res.json({ success: true, message: 'User routes are working!' });
});

router.get('/ping', (req, res) => {
  res.json({ success: true, message: 'User routes ping successful' });
});

// ============ DEBUG ROUTE ============
router.get('/debug/all', async (req, res) => {
  try {
    const User = require("../models/user.model");
    const users = await User.find({}).select('name email firebaseUid uid balance isActive');
    console.log('📊 Debug - Total users in DB:', users.length);
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
router.get('/', userController.getUsers);

// ============ SYNC ROUTE ============
router.post('/sync', userController.syncFirebaseUser);

// ============ LEADERBOARD ROUTES ============
router.get('/leaderboard/top10', userController.getTopBalanceUsers);
router.get('/leaderboard/rank/:userId', userController.getUserBalanceRank);
router.get('/leaderboard/all', userController.getLeaderboardPaginated);

// ============ STATISTICS ROUTES ============
router.get('/stats/overview', userController.getUserStats);
router.get('/stats/referrals', userController.getTotalReferrals);
router.get('/stats/wallets', userController.getTotalConnectedWallets);
router.get('/stats/calculator-usage', userController.getTotalCalculatorUsage);

// ============ SPECIAL ROUTES ============
router.get('/calculator-users', userController.getCalculatorUsers);
router.post('/edit-balance', userController.editUserBalance);

// ============ SESSION ROUTES ============
router.get('/:id/sessions', userController.getUserSessions);
router.put('/:id/sessions', userController.updateUserSession);

// ============ NOTIFICATION SETTINGS ============
router.put('/:id/notifications', userController.updateNotificationSettings);

// ============ FCM TOKEN MANAGEMENT ============
router.post('/:id/fcm-token', userController.addFcmToken);
router.delete('/:id/fcm-token', userController.removeFcmToken);

// ============ SCREENSHOT MANAGEMENT ============
router.get('/:userId/screenshots', userController.getUserScreenshots);
router.post('/:id/screenshots', userController.addScreenshot);

// ============ USER STATUS MANAGEMENT ============
router.put('/:id/ban', userController.banUser);
router.put('/:id/unban', userController.unbanUser);

// ============ COIN TRANSFER ============
router.post('/:id/transfer', userController.manualCoinTransfer);

// ============ GENERIC USER UPDATE (LAST) ============
router.put('/:id', userController.updateUser);

module.exports = router;
