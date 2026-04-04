const express = require("express")
const router = express.Router()
const userController = require("../controllers/user.controller")

console.log('🚀 USER ROUTES FILE LOADED');

// Test route - MUST work
router.get('/test', (req, res) => {
  console.log('✅ TEST ROUTE HIT');
  res.json({ success: true, message: 'User routes working!' });
});

// Get all users - MAIN ROUTE
router.get('/', userController.getUsers);

// Sync user
router.post('/sync', userController.syncFirebaseUser);

// Debug route
router.get('/debug/all', async (req, res) => {
  try {
    const User = require("../models/user.model");
    const users = await User.find({}).select('name email firebaseUid');
    console.log('📊 Total users:', users.length);
    res.json({ success: true, total: users.length, users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Leaderboard
router.get('/leaderboard/top10', userController.getTopBalanceUsers);
router.get('/leaderboard/rank/:userId', userController.getUserBalanceRank);
router.get('/leaderboard/all', userController.getLeaderboardPaginated);

// Stats
router.get('/stats/overview', userController.getUserStats);
router.get('/stats/referrals', userController.getTotalReferrals);
router.get('/stats/wallets', userController.getTotalConnectedWallets);
router.get('/stats/calculator-usage', userController.getTotalCalculatorUsage);

// Other routes
router.get('/calculator-users', userController.getCalculatorUsers);
router.post('/edit-balance', userController.editUserBalance);
router.get('/:id/sessions', userController.getUserSessions);
router.put('/:id/sessions', userController.updateUserSession);
router.put('/:id/notifications', userController.updateNotificationSettings);
router.post('/:id/fcm-token', userController.addFcmToken);
router.delete('/:id/fcm-token', userController.removeFcmToken);
router.get('/:userId/screenshots', userController.getUserScreenshots);
router.post('/:id/screenshots', userController.addScreenshot);
router.put('/:id/ban', userController.banUser);
router.put('/:id/unban', userController.unbanUser);
router.post('/:id/transfer', userController.manualCoinTransfer);
router.put('/:id', userController.updateUser);

module.exports = router;
