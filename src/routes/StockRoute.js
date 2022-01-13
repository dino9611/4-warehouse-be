const express = require("express");
const router = express.Router();
const { StockController } = require("./../controllers");
const {
  getWarehouseNearest,
  requestStock,
  getStockRequest,
  rejectingRequest,
  checkingRequest,
  acceptingRequest,
  logRequest,
} = StockController;

router.get("/get/nearest-warehouse", getWarehouseNearest);
router.post("/add/request-stock", requestStock);
router.get("/get/stock-request", getStockRequest);
router.patch("/reject/stock-request", rejectingRequest);
router.post("/accept/stock-request", acceptingRequest);
router.get("/get/checking-request", checkingRequest);
router.get("/get/log-request", logRequest);

module.exports = router;
