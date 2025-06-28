const express = require('express');
const userController = require('../controllers/user.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', userController.getUsers);
router.get('/total-referrals', userController.getTotalReferrals);
router.get('/total-wallets', userController.getTotalConnectedWallets);
router.post('/:id/ban', userController.banUser);
router.post('/:id/unban', userController.unbanUser);
router.post('/:id/coin-transfer', authorize('superadmin'), userController.manualCoinTransfer);
router.post('/change-password',  userController.changePassword);
router.get('/profile', userController.getProfile);
router.put('/profile',  userController.updateProfile);
router.get('/calculator-users', userController.getCalculatorUsers);
router.get('/total-calculator-usage', userController.getTotalCalculatorUsage);

// ✅ Protect balance edit route for superadmin
router.put('/edit-balance',  userController.editUserBalance);

module.exports = router;
