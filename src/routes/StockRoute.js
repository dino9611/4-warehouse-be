const express = require("express");
const router = express.Router();
const { StockController } = require("./../controllers");
const { getWarehouseNearest } = StockController;

router.get("/get/nearest-warehouse", getWarehouseNearest);

module.exports = router;
