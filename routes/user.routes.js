const express = require("express")
const router = express.Router()
const userController = require("../controllers/user.controller")
const multer = require('multer')
const cloudinary = require('cloudinary').v2
const { CloudinaryStorage } = require('multer-storage-cloudinary')
require('dotenv').config()

console.log('🚀 USER ROUTES FILE LOADED');

// ============ CLOUDINARY CONFIGURATION ============
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ============ SCREENSHOT UPLOAD STORAGE ============
const screenshotStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'user_screenshots',
    format: async (req, file) => {
      const ext = file.originalname.split('.').pop().toLowerCase();
      return ext === 'png' ? 'png' : 'jpg';
    },
    public_id: (req, file) => {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 10);
      return `screenshot_${timestamp}_${random}`;
    }
  }
});

const uploadScreenshots = multer({ 
  storage: screenshotStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, JPG, PNG images are allowed'), false);
    }
  }
});

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
    const users = await User.find({}).select('name email firebaseUid uid balance isActive screenshots');
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

// ============ ✅ NEW - SCREENSHOT UPLOAD ENDPOINT ============
router.post('/upload-screenshots', uploadScreenshots.array('screenshots', 10), async (req, res) => {
  try {
    console.log('📸 Upload endpoint hit');
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No files uploaded' 
      });
    }
    
    // Get user email from request body or auth token
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email is required' 
      });
    }
    
    // Get Cloudinary URLs from uploaded files
    const screenshotUrls = req.files.map(file => file.path);
    
    console.log(`✅ Uploaded ${screenshotUrls.length} screenshots for ${email}`);
    console.log('URLs:', screenshotUrls);
    
    // Find user and update
    const User = require("../models/user.model");
    const user = await User.findOne({ email: email });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    // Add screenshots to user's array
    user.screenshots.push(...screenshotUrls);
    user.updatedAt = new Date();
    await user.save();
    
    res.json({
      success: true,
      urls: screenshotUrls,
      count: screenshotUrls.length,
      message: `${screenshotUrls.length} screenshot(s) uploaded successfully`
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ============ ✅ NEW - UPDATE SCREENSHOTS ENDPOINT ============
router.put('/update-screenshots', async (req, res) => {
  try {
    const { email, screenshots } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email required' });
    }
    
    const User = require("../models/user.model");
    const user = await User.findOne({ email: email });
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    user.screenshots = screenshots || [];
    user.updatedAt = new Date();
    await user.save();
    
    res.json({
      success: true,
      message: 'Screenshots updated successfully'
    });
    
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ USER STATUS MANAGEMENT ============
router.put('/:id/ban', userController.banUser);
router.put('/:id/unban', userController.unbanUser);

// ============ COIN TRANSFER ============
router.post('/:id/transfer', userController.manualCoinTransfer);

// ============ GENERIC USER UPDATE (LAST) ============
router.put('/:id', userController.updateUser);

module.exports = router;
