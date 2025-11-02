const TransferHistory = require("../models/transfer.model");

// Internal call (already implemented)
const recordTransfer = async ({ email, userName, amount, adminName }) => {
  try {
    console.log("🟡 In recordTransfer:", { email, userName, amount, adminName });

    const newTransfer = new TransferHistory({
      email,
      userName,
      amount,
      adminName,
    });

    const saved = await newTransfer.save();
    console.log("✅ Transfer recorded:", saved);

    return { success: true };
  } catch (error) {
    console.error("❌ Failed to record transfer:", error.message);
    return { success: false, error: error.message };
  }
};

// GET: /api/transfer/transferHistory
const getTransferHistory = async (req, res) => {
  try {
    const records = await TransferHistory.find().sort({ dateTime: -1 });
    res.status(200).json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch history", error: error.message });
  }
};

// POST: /api/transfer/transferHistory (manual creation — optional)
const updateTransferHistory = async (req, res) => {
  try {
    const { email, userName, amount, adminName } = req.body;
    const result = await recordTransfer({ email, userName, amount, adminName });
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to record transfer", error: error.message });
  }
};

module.exports = { recordTransfer, getTransferHistory, updateTransferHistory };
