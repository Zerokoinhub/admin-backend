const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const User = require('../models/User'); // Your User model
require('dotenv').config();

// Configure Cloudinary (reuse existing config)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ✅ New storage for screenshots (not notifications)
const screenshotStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'user_screenshots',  // Different folder
    format: async (req, file) => {
      const ext = file.originalname.split('.').pop();
      return ext === 'png' ? 'png' : 'jpg';
    },
    public_id: (req, file) => `screenshot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
});

const uploadScreenshots = multer({ storage: screenshotStorage });

// ✅ The route handler
const uploadScreenshotsHandler = async (req, res) => {
  try {
    const { email } = req.body;
    const files = req.files;
    
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    
    // Extract URLs from uploaded files
    const screenshotUrls = files.map(file => file.path); // Cloudinary URL
    
    // Update user in database
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    user.screenshots.push(...screenshotUrls);
    await user.save();
    
    res.json({
      success: true,
      urls: screenshotUrls,
      count: screenshotUrls.length,
      message: 'Screenshots uploaded successfully'
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Export both for use in routes
module.exports = { uploadScreenshots, uploadScreenshotsHandler };
