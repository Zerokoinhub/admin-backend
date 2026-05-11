const User = require("../models/user.model")
const { validationResult } = require("express-validator")
const { recordTransfer } = require("./transfer.controller")

const CACHE_DURATION = 300
const cache = new Map()

const updateUserPhoto = async (req, res) => {
  try {
    const { email, photoURL } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }
    
    // ✅ Use findOneAndUpdate to bypass validation
    const user = await User.findOneAndUpdate(
      { email: email },
      { 
        $set: { 
          photoURL: photoURL,
          updatedAt: new Date()
        } 
      },
      { 
        new: true,
        runValidators: false  // ✅ Skip validation
      }
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    
    cache.clear();
    
    res.json({
      success: true,
      message: "Profile picture updated successfully",
      photoURL: user.photoURL,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL
      }
    });
    
  } catch (error) {
    console.error("Error updating user photo:", error);
    res.status(500).json({
      success: false,
      message: "Error updating profile picture",
      error: error.message
    });
  }
};
const uploadScreenshotsHandler = async (req, res) => {
  try {
    const { email } = req.body
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      })
    }
    
    // Files should be uploaded via multer to Cloudinary first
    // The URLs will be in req.files
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded",
      })
    }
    
    // Extract Cloudinary URLs from uploaded files
    const screenshotUrls = req.files.map(file => file.path || file.secure_url)
    
    // Find user by email
    const user = await User.findOne({ email: email })
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }
    
    // Add all screenshot URLs
    user.screenshots.push(...screenshotUrls)
    user.updatedAt = new Date()
    await user.save()
    
    res.json({
      success: true,
      message: `${screenshotUrls.length} screenshot(s) uploaded successfully`,
      urls: screenshotUrls,
      screenshots: user.screenshots,
    })
    
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({
      success: false,
      message: "Error uploading screenshots",
      error: error.message,
    })
  }
}

// Export both functions
// Sync Firebase user to MongoDB
const syncFirebaseUser = async (req, res) => {
  try {
    const { uid, email, name, photoURL, deviceId } = req.body;

    if (!uid || !email) {
      return res.status(400).json({
        success: false,
        message: "UID and email are required",
      });
    }

    // Check if user exists by UID first, then by email
    let user = await User.findOne({ $or: [{ uid: uid }, { email: email }] });

    if (user) {
      // Update existing user
      user.uid = uid; // Ensure UID is set
      if (name) user.name = name;
      if (photoURL) user.photoURL = photoURL;
      if (deviceId) user.deviceId = deviceId;
      user.lastLogin = new Date();
      
      await user.save();
      
      // Ensure sessions exist for user
      await ensureUserSessions(user._id);
      
      return res.json({
        success: true,
        message: "User synced successfully",
        user: {
          id: user._id,
          uid: user.uid,
          name: user.name,
          email: user.email,
          balance: user.balance,
          role: user.role,
          isActive: user.isActive,
          sessions: user.sessions,
        },
      });
    } else {
      // Create new user
      const username = email.split('@')[0] + Math.random().toString(36).substring(2, 6);
      
      user = new User({
        uid: uid,
        name: name || email.split('@')[0],
        username: username,
        email: email,
        photoURL: photoURL || "",
        isActive: true,
        balance: 0,
        recentAmount: 0,
        deviceId: deviceId || "",
        sessions: [
          { sessionNumber: 1, isLocked: false, unlockedAt: new Date(), completedAt: null },
          { sessionNumber: 2, isLocked: true, unlockedAt: null, completedAt: null },
          { sessionNumber: 3, isLocked: true, unlockedAt: null, completedAt: null },
          { sessionNumber: 4, isLocked: true, unlockedAt: null, completedAt: null },
        ],
      });
      
      // Generate invite code
      user.generateInviteCode();
      
      await user.save();
      
      return res.status(201).json({
        success: true,
        message: "User created and synced successfully",
        user: {
          id: user._id,
          uid: user.uid,
          name: user.name,
          email: user.email,
          balance: user.balance,
          role: user.role,
          isActive: user.isActive,
          sessions: user.sessions,
        },
      });
    }
  } catch (error) {
    console.error("Error in syncFirebaseUser:", error);
    res.status(500).json({
      success: false,
      message: "Error syncing user",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Helper function to ensure user has sessions
const ensureUserSessions = async (userId) => {
  const user = await User.findById(userId);
  if (user && (!user.sessions || user.sessions.length === 0)) {
    user.sessions = [
      { sessionNumber: 1, isLocked: false, unlockedAt: new Date(), completedAt: null },
      { sessionNumber: 2, isLocked: true, unlockedAt: null, completedAt: null },
      { sessionNumber: 3, isLocked: true, unlockedAt: null, completedAt: null },
      { sessionNumber: 4, isLocked: true, unlockedAt: null, completedAt: null },
    ];
    await user.save();
    console.log(`✅ Sessions created for user ${userId}`);
  }
};
// Get all users with pagination and filtering
// Get all users with pagination and filtering
const getUsers = async (req, res) => {
  try {
    console.log('📡 GET USERS API CALLED');
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const search = req.query.search || "";
    
    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    
    const skip = (page - 1) * limit;
    
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    const total = await User.countDocuments(query);
    
    // ✅ Add photoURL to response
    const usersWithPhoto = users.map(user => ({
      ...user,
      photoURL: user.photoURL || null,
      profilePicture: user.photoURL || user.profilePicture || null,
    }));
    
    res.json({
      success: true,
      users: usersWithPhoto,
      data: usersWithPhoto,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
    
  } catch (error) {
    console.error("Error in getUsers:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: error.message
    });
  }
};
const updateUser = async (req, res) => {
  try {
    const { id } = req.params
    const updateData = req.body

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      })
    }

    const currentUser = await User.findById(id)
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Allowed fields for update
    const allowedFields = [
      "name",
      "email",
      "balance",
      "isActive",
      "role",
      "calculatorUsage",
      "inviteCode",
      "referredBy",
      "walletAddresses",
      "walletStatus",
      "country",
      "notificationSettings",
      "recentAmount",
      "screenshots",
    ]

    const updateObject = {}
    allowedFields.forEach((field) => {
      if (updateData.hasOwnProperty(field)) {
        updateObject[field] = updateData[field]
      }
    })

    // Handle nested objects
    if (updateData.walletAddresses) {
      updateObject.walletAddresses = {
        metamask: updateData.walletAddresses.metamask || currentUser.walletAddresses?.metamask || null,
        trustWallet: updateData.walletAddresses.trustWallet || currentUser.walletAddresses?.trustWallet || null,
      }
    }

    if (updateData.notificationSettings) {
      updateObject.notificationSettings = {
        sessionUnlocked:
          updateData.notificationSettings.sessionUnlocked ?? currentUser.notificationSettings?.sessionUnlocked ?? true,
        pushEnabled:
          updateData.notificationSettings.pushEnabled ?? currentUser.notificationSettings?.pushEnabled ?? true,
      }
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateObject, {
      new: true,
      runValidators: true,
    }).select("-password")

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    cache.clear()

    res.json({
      success: true,
      message: "User updated successfully",
      user: updatedUser,
      changes: updateObject,
    })
  } catch (error) {
    console.error("Error in updateUser:", error)
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map((err) => err.message)
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: validationErrors,
      })
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0]
      return res.status(400).json({
        success: false,
        message: `${field} already exists`,
      })
    }

    res.status(500).json({
      success: false,
      message: "Error updating user",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// Session Management
const updateUserSession = async (req, res) => {
  try {
    const { id } = req.params
    const { sessionNumber, action } = req.body

    if (!sessionNumber || !action) {
      return res.status(400).json({
        success: false,
        message: "Session number and action are required",
      })
    }

    const user = await User.findById(id)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    const sessionIndex = user.sessions.findIndex((s) => s.sessionNumber === sessionNumber)
    if (sessionIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      })
    }

    const session = user.sessions[sessionIndex]

    switch (action) {
      case "unlock":
        session.unlockedAt = new Date()
        session.isLocked = false
        break
      case "complete":
        session.completedAt = new Date()
        break
      case "claim":
        session.isClaimed = true
        break
      case "lock":
        session.isLocked = true
        break
      default:
        return res.status(400).json({
          success: false,
          message: "Invalid action",
        })
    }

    await user.save()
    cache.clear()

    res.json({
      success: true,
      message: `Session ${sessionNumber} ${action}ed successfully`,
      session: session,
    })
  } catch (error) {
    console.error("Error in updateUserSession:", error)
    res.status(500).json({
      success: false,
      message: "Error updating session",
      error: error.message,
    })
  }
}

// Get user sessions
const getUserSessions = async (req, res) => {
  try {
    const { id } = req.params
    const user = await User.findById(id).select("sessions")

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    res.json({
      success: true,
      sessions: user.sessions,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching sessions",
      error: error.message,
    })
  }
}

// Update notification settings
const updateNotificationSettings = async (req, res) => {
  try {
    const { id } = req.params
    const { sessionUnlocked, pushEnabled } = req.body

    const updateObject = {}
    if (sessionUnlocked !== undefined) updateObject["notificationSettings.sessionUnlocked"] = sessionUnlocked
    if (pushEnabled !== undefined) updateObject["notificationSettings.pushEnabled"] = pushEnabled

    const user = await User.findByIdAndUpdate(id, updateObject, { new: true }).select("-password")

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    cache.clear()

    res.json({
      success: true,
      message: "Notification settings updated successfully",
      notificationSettings: user.notificationSettings,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating notification settings",
      error: error.message,
    })
  }
}

// Add FCM token
const addFcmToken = async (req, res) => {
  try {
    const { id } = req.params
    const { token } = req.body

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "FCM token is required",
      })
    }

    const user = await User.findById(id)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Add token if it doesn't exist
    if (!user.fcmTokens.includes(token)) {
      user.fcmTokens.push(token)
      await user.save()
    }

    cache.clear()

    res.json({
      success: true,
      message: "FCM token added successfully",
      fcmTokens: user.fcmTokens,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error adding FCM token",
      error: error.message,
    })
  }
}

// Remove FCM token
const removeFcmToken = async (req, res) => {
  try {
    const { id } = req.params
    const { token } = req.body

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "FCM token is required",
      })
    }

    const user = await User.findById(id)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    user.fcmTokens = user.fcmTokens.filter((t) => t !== token)
    await user.save()

    cache.clear()

    res.json({
      success: true,
      message: "FCM token removed successfully",
      fcmTokens: user.fcmTokens,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error removing FCM token",
      error: error.message,
    })
  }
}

//GET Screenshots
 const getUserScreenshots = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find user and only select the screenshots field
    const user = await User.findById(userId).select("screenshots");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      screenshots: user.screenshots || [],
    });
  } catch (error) {
    console.error("Error fetching screenshots:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
// Add screenshot
const addScreenshot = async (req, res) => {
  try {
    const { id } = req.params
    const { screenshot, email } = req.body

    // Accept both formats: direct URL or object with url
    let screenshotUrl = null
    
    if (typeof screenshot === 'string') {
      // Direct URL from mobile app
      screenshotUrl = screenshot
    } else if (screenshot && typeof screenshot === 'object') {
      // Object format with url property
      screenshotUrl = screenshot.url || screenshot.imageUrl || null
    }

    // If no screenshot found in body, check for email-based update
    if (!screenshotUrl && email) {
      // This is for admin panel manual updates
      const user = await User.findOne({ email: email })
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        })
      }
      
      // If screenshots array is provided in body
      if (req.body.screenshots && Array.isArray(req.body.screenshots)) {
        user.screenshots = req.body.screenshots
        await user.save()
        return res.json({
          success: true,
          message: "Screenshots updated successfully",
          screenshots: user.screenshots,
        })
      }
    }

    // If no valid screenshot URL found
    if (!screenshotUrl) {
      return res.status(400).json({
        success: false,
        message: "Screenshot URL is required",
      })
    }

    // Find user by ID
    const user = await User.findById(id)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Add screenshot URL to array
    user.screenshots.push(screenshotUrl)
    user.updatedAt = new Date()
    await user.save()

    // Clear cache if you have one
    if (typeof cache !== 'undefined' && cache.clear) {
      cache.clear()
    }

    res.json({
      success: true,
      message: "Screenshot added successfully",
      screenshots: user.screenshots,
    })
  } catch (error) {
    console.error('Add screenshot error:', error)
    res.status(500).json({
      success: false,
      message: "Error adding screenshot",
      error: error.message,
    })
  }
}// Get user statistics
const getUserStats = async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          totalBalance: { $sum: "$balance" },
          totalReferrals: {
            $sum: {
              $cond: [{ $ne: ["$referredBy", null] }, 1, 0],
            },
          },
          totalCalculatorUsage: { $sum: "$calculatorUsage" },
          connectedWallets: {
            $sum: {
              $cond: [
                {
                  $or: [
                    {
                      $and: [{ $ne: ["$walletAddresses.metamask", null] }, { $ne: ["$walletAddresses.metamask", ""] }],
                    },
                    {
                      $and: [
                        { $ne: ["$walletAddresses.trustWallet", null] },
                        { $ne: ["$walletAddresses.trustWallet", ""] },
                      ],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },
          activeUsers: {
            $sum: {
              $cond: [{ $eq: ["$isActive", true] }, 1, 0],
            },
          },
        },
      },
    ])

    const countryStats = await User.aggregate([
      { $group: { _id: "$country", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ])

    res.json({
      success: true,
      stats: stats[0] || {},
      countryStats,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching user statistics",
      error: error.message,
    })
  }
}

// Existing functions (keeping all the original ones)
const getTotalReferrals = async (req, res) => {
  try {
    const totalReferrals = await User.countDocuments({
      referredBy: { $ne: null },
    })
    res.json({ success: true, totalReferrals })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching total referrals",
      error: error.message,
    })
  }
}

const banUser = async (req, res) => {
  try {
    const { id } = req.params
    const user = await User.findByIdAndUpdate(id, { isActive: false }, { new: true })
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" })
    }
    cache.clear()
    res.json({ success: true, message: "User banned", user })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error banning user",
      error: error.message,
    })
  }
}

const unbanUser = async (req, res) => {
  try {
    const { id } = req.params
    const user = await User.findByIdAndUpdate(id, { isActive: true }, { new: true })
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" })
    }
    cache.clear()
    res.json({ success: true, message: "User unbanned", user })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error unbanning user",
      error: error.message,
    })
  }
}

const manualCoinTransfer = async (req, res) => {
  try {
    const { id } = req.params
    const { amount, reason } = req.body

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be positive",
      })
    }

    const user = await User.findById(id)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    const previousBalance = user.balance || 0
    user.balance = previousBalance + amount
    user.recentAmount = amount
    await user.save()

    cache.clear()

    res.json({
      success: true,
      message: "Coins transferred successfully",
      user,
      transaction: {
        previousBalance,
        newBalance: user.balance,
        amountTransferred: amount,
        reason,
        timestamp: new Date(),
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error transferring coins",
      error: error.message,
    })
  }
}

const getTotalConnectedWallets = async (req, res) => {
  try {
    const totalWallets = await User.countDocuments({
      $or: [
        { "walletAddresses.metamask": { $ne: null, $exists: true, $ne: "" } },
        { "walletAddresses.trustWallet": { $ne: null, $exists: true, $ne: "" } },
      ],
    })
    res.json({ success: true, totalWallets })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching wallet count",
      error: error.message,
    })
  }
}

const getCalculatorUsers = async (req, res) => {
  try {
    const users = await User.find({ calculatorUsage: { $gt: 0 } })
    res.json({ success: true, users })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching calculator users",
      error: error.message,
    })
  }
}

const getTotalCalculatorUsage = async (req, res) => {
  try {
    const result = await User.aggregate([
      {
        $group: {
          _id: null,
          totalCalculatorUsage: { $sum: "$calculatorUsage" },
        },
      },
    ])
    const totalCalculatorUsage = result[0]?.totalCalculatorUsage || 0
    res.json({ success: true, totalCalculatorUsage })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching total calculator usage",
      error: error.message,
    })
  }
}

const editUserBalance = async (req, res) => {
  try {
    const { email, newBalance, admin } = req.body
    if (!email || typeof newBalance !== "number" || newBalance <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid input: email and positive number required.",
      })
    }

    const user = await User.findOne({
      email: new RegExp(`^${email}$`, "i"),
    })
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      })
    }

    const balanceBefore = user.balance || 0
    const newTotalBalance = balanceBefore + newBalance
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        balance: newTotalBalance,
        recentAmount: newBalance,
      },
      { new: true },
    )

    await recordTransfer({
      email: user.email,
      userName: user.name,
      amount: newBalance,
      adminName: admin || "System",
    })

    console.log(`[INFO] Admin "${admin}" updated balance of "${user.email}" by ${newBalance}`)

    cache.clear()

    return res.status(200).json({
      success: true,
      message: "Balance manually updated and transfer recorded.",
      user: updatedUser,
      transaction: {
        balanceBefore,
        newBalance: updatedUser.balance,
        amountChanged: newBalance,
        timestamp: new Date(),
      },
    })
  } catch (error) {
    console.error("editUserBalance error:", error)
    return res.status(500).json({
      success: false,
      message: "Failed to update user balance.",
      error: error.message,
    })
  }
}

const updateProfile = async (req, res) => {
  try {
    const allowedUpdates = ["name", "username", "email", "country", "notificationSettings"]
    const updates = {}
    allowedUpdates.forEach((field) => {
      if (req.body[field]) {
        updates[field] = req.body[field]
      }
    })

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).select("-password")

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      user,
    })
  } catch (error) {
    console.error("Error in updateProfile:", error)
    res.status(500).json({
      success: false,
      message: "Error updating profile",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password")
    res.json({ success: true, user })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching profile",
      error: error.message,
    })
  }
}

const changePassword = async (req, res) => {
  try {
    const userId = req.user._id
    const { oldPassword, newPassword, confirmPassword } = req.body

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    const isMatch = await user.comparePassword(oldPassword)
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Old password is incorrect",
      })
    }

    user.password = newPassword
    await user.save()

    res.json({ success: true, message: "Password changed successfully" })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error changing password",
      error: error.message,
    })
  }
}
// Get top 10 users by balance for leaderboard

// Get top 10 users by balance for leaderboard
const getTopBalanceUsers = async (req, res) => {
  try {
    console.log('📊 Fetching top users by balance...');

    // ✅ FORCE REFRESH - No cache
    const topUsers = await User.find({ 
      
      balance: { $gt: 0 }
    })
    .select('name username email balance photoURL profilePicture country sessions completedSessionsCount')
    .sort({ balance: -1 })
    .limit(10)
    .lean();

    const formattedUsers = topUsers.map((user, index) => {
      // Get latest balance
      const currentBalance = user.balance || 0;
      
      return {
        rank: index + 1,
        id: user._id,
        name: user.name || user.username || 'Anonymous User',
        email: user.email,
        balance: currentBalance,  // ✅ Latest balance
        photoURL: user.photoURL || null,
        profilePicture: user.photoURL || user.profilePicture || null,
        country: user.country || 'Unknown',
        sessionsCompleted: user.completedSessionsCount || 0,
      };
    });

    res.json({
      success: true,
      data: {
        topUsers: formattedUsers,
        stats: {
          totalUsersWithBalance: await User.countDocuments({ isActive: true, balance: { $gt: 0 } }),
          highestBalance: formattedUsers[0]?.balance || 0,
          lastUpdated: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
// Get user's rank by balance (if not in top 10)
const getUserBalanceRank = async (req, res) => {
  try {
    const { userId } = req.params

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      })
    }

    // Find the user
    const user = await User.findById(userId).select('balance name username email profilePicture')
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    // Count users with higher balance
    const rank = await User.countDocuments({
      isActive: true,
      balance: { $gt: user.balance || 0 }
    }) + 1

    // Get total users count
    const totalUsers = await User.countDocuments({ 
      isActive: true,
      balance: { $gt: 0 }
    })

    res.json({
      success: true,
      data: {
        rank: rank,
        totalUsers: totalUsers,
        topPercentile: totalUsers > 0 ? ((rank / totalUsers) * 100).toFixed(1) : 0,
        user: {
          id: user._id,
          name: user.name || user.username || 'Anonymous User',
          balance: user.balance || 0,
          profilePicture: user.profilePicture || null
        }
      }
    })

  } catch (error) {
    console.error('❌ Error in getUserBalanceRank:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching user rank',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

// Get leaderboard with pagination (if you want more than top 10)
const getLeaderboardPaginated = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 20
    const skip = (page - 1) * limit

    // Get paginated users
    const users = await User.find({ 
      isActive: true,
      balance: { $gt: 0 }
    })
    .select('name username email balance profilePicture country')
    .sort({ balance: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

    // Get total count for pagination
    const totalUsers = await User.countDocuments({ 
      isActive: true,
      balance: { $gt: 0 }
    })

    const totalPages = Math.ceil(totalUsers / limit)

    const formattedUsers = users.map((user, index) => ({
      rank: skip + index + 1,
      id: user._id,
      name: user.name || user.username || 'Anonymous User',
      email: user.email,
      balance: user.balance || 0,
      profilePicture: user.profilePicture || null,
      country: user.country || 'Unknown'
    }))

    res.json({
      success: true,
      data: {
        users: formattedUsers,
        pagination: {
          currentPage: page,
          totalPages: totalPages,
          totalUsers: totalUsers,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    })

  } catch (error) {
    console.error('❌ Error in getLeaderboardPaginated:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching leaderboard',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}
module.exports = {
  syncFirebaseUser,
  getTopBalanceUsers,
  getUserBalanceRank,
  getLeaderboardPaginated,
  getUsers,
  updateUserPhoto,
  updateUser,
  updateUserSession,
  getUserSessions,
  updateNotificationSettings,
  addFcmToken,
  removeFcmToken,
  getUserScreenshots,
  addScreenshot,
  getUserStats,
  getTotalReferrals,
  banUser,
  unbanUser,
  manualCoinTransfer,
  getTotalConnectedWallets,
  getCalculatorUsers,
  getTotalCalculatorUsage,
  editUserBalance,
  updateProfile,
  getProfile,
  changePassword,
   uploadScreenshotsHandler,
}
