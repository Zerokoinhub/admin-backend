
const express = require("express");
const router = express.Router();
const {
  getWithdrawalRequests,
  updateWithdrawalStatus,
} = require("../controllers/withdrawal.controller");


router.route("/").get(getWithdrawalRequests);
router.route("/:id/status").put(updateWithdrawalStatus);

module.exports = router;