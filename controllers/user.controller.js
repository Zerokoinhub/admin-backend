const User = require("../models/user.model");
const { validationResult } = require("express-validator");

const CACHE_DURATION = 300;

const cache = new Map();

exports.getUsers = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
    const search = req.query.search || "";
    const role = req.query.role;
    const isActive = req.query.isActive;

    const cacheKey = `users_${page}_${limit}_${sortBy}_${sortOrder}_${search}_${role}_${isActive}`;

    if (cache.has(cacheKey)) {
      const cachedData = cache.get(cacheKey);
      if (Date.now() - cachedData.timestamp < CACHE_DURATION * 1000) {
        return res.json(cachedData.data);
      }
      cache.delete(cacheKey);
    }

    const query = {};

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (role) {
      query.role = role;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password")
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

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
    };

    cache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now(),
    });

    res.json(responseData);
  } catch (error) {
    console.error("Error in getUsers:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

exports.getTotalReferrals = async (req, res) => {
  try {
    const totalReferrals = await User.countDocuments({
      referredBy: { $ne: null },
    });
    res.json({ success: true, totalReferrals });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching total referrals",
      error: error.message,
    });
  }
};

exports.banUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    res.json({ success: true, message: "User banned", user });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error banning user",
      error: error.message,
    });
  }
};

exports.unbanUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(
      id,
      { isActive: true },
      { new: true }
    );
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    res.json({ success: true, message: "User unbanned", user });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error unbanning user",
      error: error.message,
    });
  }
};

exports.manualCoinTransfer = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;
    if (amount <= 0)
      return res
        .status(400)
        .json({ success: false, message: "Amount must be positive" });
    const user = await User.findById(id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    user.balance = (user.balance || 0) + amount;
    await user.save();
    res.json({ success: true, message: "Coins transferred", user });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error transferring coins",
      error: error.message,
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const userId = req.user._id;
    const { oldPassword, newPassword, confirmPassword } = req.body;
    if (newPassword !== confirmPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Passwords do not match" });
    }
    const user = await User.findById(userId);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch)
      return res
        .status(400)
        .json({ success: false, message: "Old password is incorrect" });
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error changing password",
      error: error.message,
    });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching profile",
      error: error.message,
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { username } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { username },
      { new: true }
    ).select("-password");
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating profile",
      error: error.message,
    });
  }
};

exports.getTotalConnectedWallets = async (req, res) => {
  try {
    // Count users where at least one wallet address is not null or empty
    const totalWallets = await User.countDocuments({
      $or: [
        { "walletAddresses.metamask": { $ne: null, $exists: true, $ne: "" } },
        {
          "walletAddresses.trustWallet": { $ne: null, $exists: true, $ne: "" },
        },
        // Add more wallet types if you support them
      ],
    });
    res.json({ success: true, totalWallets });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching wallet count",
      error: error.message,
    });
  }
};

exports.getCalculatorUsers = async (req, res) => {
  try {
    const users = await User.find({ calculatorUsageCount: { $gt: 0 } });
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching calculator users",
      error: error.message,
    });
  }
};

exports.getTotalCalculatorUsage = async (req, res) => {
  try {
    // Aggregate the sum of calculatorUsage for all users
    const result = await User.aggregate([
      {
        $group: {
          _id: null,
          totalCalculatorUsage: { $sum: "$calculatorUsage" },
        },
      },
    ]);
    const totalCalculatorUsage = result[0]?.totalCalculatorUsage || 0;
    res.json({ success: true, totalCalculatorUsage });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching total calculator usage",
      error: error.message,
    });
  }
};

// Edit a user's balance directly

const { recordTransfer } = require("../controllers/transfer.controller");

exports.editUserBalance = async (req, res) => {
  try {
    const { email, newBalance , admin} = req.body;

    if (!email || typeof newBalance !== "number" || newBalance <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid input: username and positive number required.",
      });
    }

    // Case-insensitive username match
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

    // Update user balance using $inc
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $inc: { balance: newBalance } },
      { new: true }
    );

    const amountTransferred = newBalance;

    // ✅ Record transfer in TransferHistory collection
    await recordTransfer({
      email: user.email,
      firebaseUid: user.firebaseUid,
      userName: user.name, // full name
      amount: amountTransferred,
      adminName:admin,
    });
    console.log("This is admin" , admin);
    return res.status(200).json({
      success: true,
      message: "Balance updated and transfer recorded.",
      user: updatedUser,
      transaction: {
        balanceBefore,
        newBalance: updatedUser.balance,
        amountChanged: amountTransferred,
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


