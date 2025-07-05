const express = require("express")
const router = express.Router()
const userController = require("../controllers/user.controller")
const { body } = require("express-validator")
// const auth = require("../middleware/auth") // Uncomment if you have auth middleware

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
]

// Debug: Check if all controller functions exist
console.log("Available controller functions:", Object.keys(userController))

// Get all users (with pagination, search, filtering)
router.get("/", userController.getUsers)

// Get user profile (current user) - comment out if auth middleware not available
// router.get("/profile", auth, userController.getProfile)

// Update user profile (current user) - comment out if auth middleware not available
// router.put("/profile", auth, userController.updateProfile)

// Update any user (admin function) - this matches your frontend userAPI.updateUser call
// router.put("/:id", auth, validateUserUpdate, userController.updateUser)
router.put("/:id", validateUserUpdate, userController.updateUser)

// Get total referrals
router.get("/stats/referrals", userController.getTotalReferrals)

// Get total connected wallets
router.get("/stats/wallets", userController.getTotalConnectedWallets)

// Get calculator users
router.get("/calculator-users", userController.getCalculatorUsers)

// Get total calculator usage
router.get("/stats/calculator-usage", userController.getTotalCalculatorUsage)

// Ban user
// router.put("/:id/ban", auth, userController.banUser)
router.put("/:id/ban", userController.banUser)

// Unban user
// router.put("/:id/unban", auth, userController.unbanUser)
router.put("/:id/unban", userController.unbanUser)

// Manual coin transfer
// router.post("/:id/transfer", auth, userController.manualCoinTransfer)
router.post("/:id/transfer", userController.manualCoinTransfer)

// Edit user balance (specific endpoint)
// router.post("/edit-balance", auth, userController.editUserBalance)
router.post("/edit-balance", userController.editUserBalance)

// Change password - comment out if auth middleware not available
// router.put("/change-password", auth, userController.changePassword)

module.exports = router
