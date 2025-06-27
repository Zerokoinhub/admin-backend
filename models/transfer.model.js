const mongoose = require("mongoose");

const transferSchema = new mongoose.Schema({
  transactionId: { type: String, required: true, unique: true },
  firebaseUid: { type: String, required: true, index: true }, // Index for faster queries
  userName: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  balanceBefore: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
  amountChanged: { 
    type: Number, 
    required: true,
    default: function () {
      return Math.abs(this.balanceAfter - this.balanceBefore);
    }
  },
  senderName: { type: String, default: "System" },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Transfer", transferSchema);
