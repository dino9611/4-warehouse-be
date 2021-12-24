const express = require("express");
const router = express.Router();
const { HistoryController } = require("./../controllers");
const { getDataHistory } = HistoryController;

router.get("/get/diproses/:userId", getDataHistory);

module.exports = router;
