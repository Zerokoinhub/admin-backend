const User = require("../models/user.model")
const { validationResult } = require("express-validator")
//const { recordTransfer } = require("./transfer.controller"); // adjust path if different

const CACHE_DURATION = 300
const cache = new Map()

// Get all users with pagination and filtering
const getUsers = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const sortBy = req.query.sortBy || "createdAt"
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1
    const search = req.query.search || ""
    const role = req.query.role
    const isActive = req.query.isActive

    const cacheKey = `users_${page}_${limit}_${sortBy}_${sortOrder}_${search}_${role}_${isActive}`

    if (cache.has(cacheKey)) {
      const cachedData = cache.get(cacheKey)
      if (Date.now() - cachedData.timestamp < CACHE_DURATION * 1000) {
        return res.json(cachedData.data)
      }
      cache.delete(cacheKey)
    }

    const query = {}
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { inviteCode: { $regex: search, $options: "i" } },
      ]
    }

    if (role) {
      query.role = role
    }

    if (isActive !== undefined) {
      query.isActive = isActive === "true"
    }

    const skip = (page - 1) * limit
    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password")
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ])

    const totalPages = Math.ceil(total / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    const responseData = {
      success: true,
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: limit,
          hasNextPage,
          hasPrevPage,
        },
      },
    }

    cache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now(),
    })

    res.json(responseData)
  } catch (error) {
    console.error("Error in getUsers:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// Update user - handles all editable fields from frontend
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
    ]

    const updateObject = {}

    allowedFields.forEach((field) => {
      if (updateData.hasOwnProperty(field)) {
        updateObject[field] = updateData[field]
      }
    })

    // Handle nested walletAddresses
    if (updateData.walletAddresses) {
      updateObject.walletAddresses = {
        metamask: updateData.walletAddresses.metamask || currentUser.walletAddresses?.metamask || "",
        trustWallet: updateData.walletAddresses.trustWallet || currentUser.walletAddresses?.trustWallet || "",
      }
    }

    // Update the user
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

    // Clear cache
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

// Get total referrals
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

// Ban user
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

// Unban user
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

// Manual coin transfer
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

// Get total connected wallets
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

// Get calculator users
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

// Get total calculator usage
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

// Edit user balance (original function)
const { recordTransfer } = require("./transfer.controller"); // ✅ Add this at the top

const editUserBalance = async (req, res) => {
  try {
    const { email, newBalance, admin } = req.body;

    if (!email || typeof newBalance !== "number" || newBalance <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid input: email and positive number required.",
      });
    }

    const user = await User.findOne({
      email: new RegExp(`^${email}$`, "i"),
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const balanceBefore = user.balance || 0;
    const newTotalBalance = balanceBefore + newBalance;

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { balance: newTotalBalance },
      { new: true }
    );

    // ✅ Record the transfer
    await recordTransfer({
      email: user.email,
      userName: user.name,
      amount: newBalance,
      adminName: admin || "System",
    });

    console.log(
      `[INFO] Admin "${admin}" updated balance of "${user.email}" by ${newBalance}`
    );

    cache.clear();

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
    });
  } catch (error) {
    console.error("editUserBalance error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update user balance.",
      error: error.message,
    });
  }
};


// Update profile (for current user)
const updateProfile = async (req, res) => {
  try {
    const allowedUpdates = ["name", "username", "email"]
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

// Get profile (for current user)
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

// Change password
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

// Export all functions
module.exports = {
  getUsers,
  updateUser,
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
}