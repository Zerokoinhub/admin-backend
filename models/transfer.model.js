const mongoose = require("mongoose");

const transferHistorySchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },   // ✅ use email instead of firebaseUid
  userName: { type: String, required: true },
  amount: { type: Number, required: true },
  dateTime: { type: Date, default: Date.now },
  adminName: { type: String, required: true },
});

module.exports = mongoose.model("TransferHistory", transferHistorySchema);
