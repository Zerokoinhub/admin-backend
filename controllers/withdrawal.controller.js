
const Withdrawal = require("../models/withdraw");
const User = require("../models/user.model");
const mongoose = require("mongoose");

exports.getWithdrawalRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search = "" } = req.query;

    const query = {};
    if (status && status !== "all") {
      query.status = status;
    }

    let userIds = [];
    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }).select("_id");
      userIds = users.map(user => user._id);
      
      query.user = { $in: userIds };
    }

    const requests = await Withdrawal.find(query)
      .populate("user", "name email balance")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Withdrawal.countDocuments(query);

    res.status(200).json({
      success: true,
      data: requests,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error fetching withdrawal requests:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


exports.updateWithdrawalStatus = async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  if (!["completed", "failed", "rejected"].includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status" });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const withdrawal = await Withdrawal.findById(id).session(session);

    if (!withdrawal) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: "Withdrawal request not found" });
    }

    if (withdrawal.status !== "pending") {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: `Request is already ${withdrawal.status}` });
    }
    
    if (status === "failed" || status === "rejected") {
      
      const userUpdateResult = await User.findByIdAndUpdate(
        withdrawal.user,
        { $inc: { balance: withdrawal.amount } },
        { session }
      );

      if (!userUpdateResult) {
        throw new Error('User not found for refund.');
      }
    }

    withdrawal.status = status;
    await withdrawal.save({ session });

    await session.commitTransaction();
    session.endSession();

    const updatedWithdrawal = await Withdrawal.findById(id).populate("user", "name email balance");

    res.status(200).json({ success: true, data: updatedWithdrawal });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error updating withdrawal status:", error);
    res.status(500).json({ success: false, message: "Server Error: " + error.message });
  }
};