const express = require("express");
const router = express.Router();
const { StockController } = require("./../controllers");
const { getWarehouseNearest, requestStock, getOngoingRequest } =
  StockController;

router.get("/get/nearest-warehouse", getWarehouseNearest);
router.post("/add/request-stock", requestStock);
router.get("/get/ongoing-request", getOngoingRequest);

module.exports = router;
