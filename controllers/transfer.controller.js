const Transfer = require("../models/transfer.model");
const { generateTransactionId } = require("../utils/helpers");

// ✅ POST /transferHistory — Record a new transaction
const updateTransferHistory = async (req, res) => {
  try {
    const {
      firebaseUid,
      balanceBefore,
      balanceAfter,
      userName,
      userId,
      senderName
    } = req.body;

    // Input validation
    if (
      !firebaseUid ||
      typeof balanceBefore !== "number" ||
      typeof balanceAfter !== "number" ||
      !userId
    ) {
      return res.status(400).json({ success: false, message: "Missing or invalid fields" });
    }

    const amountChanged = balanceAfter - balanceBefore;

    const newTransfer = await Transfer.create({
      transactionId: generateTransactionId(),
      firebaseUid,
      userName,
      userId,
      balanceBefore,
      balanceAfter,
      amountChanged,
      senderName: senderName || "System",
    });

    return res.status(201).json({
      success: true,
      message: "Transfer history recorded successfully",
      data: newTransfer
    });
  } catch (error) {
    console.error("❌ Error recording transfer:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// ✅ GET /transferHistory — Fetch transaction records
const getTransferHistory = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = "timestamp",
      sortOrder = "desc"
    } = req.query;

    const filters = {};

    if (search) {
      const regex = new RegExp(search, "i");
      filters.$or = [
        { userName: regex },
        { firebaseUid: regex },
        { senderName: regex },
        { transactionId: regex }
      ];
    }

    const total = await Transfer.countDocuments(filters);

    const transfers = await Transfer.find(filters)
      .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      transfers
    });
  } catch (error) {
    console.error("❌ Error fetching transfer history:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

module.exports = {
  updateTransferHistory,
  getTransferHistory
};
