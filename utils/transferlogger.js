// utils/transferLogger.js
const Transfer = require("../models/transfer.model");
const { generateTransactionId } = require("./helpers");

const logTransfer = async ({
  username,
  userName,
  userId,
  balanceBefore,
  balanceAfter,
  senderName = "System",
}) => {
  return await Transfer.create({
    transactionId: generateTransactionId(),
    username,
    userName,
    userId,
    balanceBefore,
    balanceAfter,
    amountChanged: balanceAfter - balanceBefore,
    senderName,
    timestamp: new Date(),
  });
};

module.exports = logTransfer;
