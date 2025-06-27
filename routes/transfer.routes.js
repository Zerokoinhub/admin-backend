const express = require("express");
const router = express.Router();
const { updateTransferHistory, getTransferHistory } = require("../controllers/transfer.controller");

router.get("/transferHistory", getTransferHistory);
router.post("/transferHistory", updateTransferHistory);

module.exports = router;
