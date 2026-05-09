const express = require("express")
const router = express.Router()
const userController = require("../controllers/user.controller")
const multer = require('multer')
const cloudinary = require('cloudinary').v2
const { CloudinaryStorage } = require('multer-storage-cloudinary')
require('dotenv').config()

// Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

// Screenshot Storage
const screenshotStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'user_screenshots',
    format: async (req, file) => {
      const ext = file.originalname.split('.').pop().toLowerCase();
      return ext === 'png' ? 'png' : 'jpg';
    },
    public_id: (req, file) => `screenshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
})

const upload = multer({ storage: screenshotStorage })

// ============ ✅ SCREENSHOT UPLOAD ENDPOINT (YE SABSE IMPORTANT HAI) ============
router.post('/upload-screenshots', upload.array('screenshots', 10), async (req, res) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ error: 'Email required' })
    if (!req.files?.length) return res.status(400).json({ error: 'No files' })

    const urls = req.files.map(f => f.path)
    const User = require("../models/user.model")
    
    await User.findOneAndUpdate(
      { email: email },
      { $push: { screenshots: { $each: urls } }, $set: { updatedAt: new Date() } }
    )
    
    res.json({ success: true, urls, count: urls.length })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// ============ ALL OTHER ROUTES ============
router.get('/', userController.getUsers)
router.post('/sync', userController.syncFirebaseUser)
router.get('/leaderboard/top10', userController.getTopBalanceUsers)
router.get('/leaderboard/rank/:userId', userController.getUserBalanceRank)
router.get('/leaderboard/all', userController.getLeaderboardPaginated)
router.get('/stats/overview', userController.getUserStats)
router.get('/stats/referrals', userController.getTotalReferrals)
router.get('/stats/wallets', userController.getTotalConnectedWallets)
router.get('/stats/calculator-usage', userController.getTotalCalculatorUsage)
router.get('/calculator-users', userController.getCalculatorUsers)
router.post('/edit-balance', userController.editUserBalance)
router.get('/:id/sessions', userController.getUserSessions)
router.put('/:id/sessions', userController.updateUserSession)
router.put('/:id/notifications', userController.updateNotificationSettings)
router.post('/:id/fcm-token', userController.addFcmToken)
router.delete('/:id/fcm-token', userController.removeFcmToken)
router.get('/:userId/screenshots', userController.getUserScreenshots)
router.post('/:id/screenshots', userController.addScreenshot)
router.put('/:id/ban', userController.banUser)
router.put('/:id/unban', userController.unbanUser)
router.post('/:id/transfer', userController.manualCoinTransfer)
router.put('/:id', userController.updateUser)

module.exports = router
