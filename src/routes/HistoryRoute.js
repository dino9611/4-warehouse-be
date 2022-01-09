const express = require("express");
const router = express.Router();
const { HistoryController } = require("./../controllers");
const { getDataHistory, getStatusOrder, getOrderDetail } = HistoryController;

router.get("/get/orders/:userId", getDataHistory);
router.get("/get/status-order", getStatusOrder);
router.get("/get/order-detail/:ordersId", getOrderDetail);

module.exports = router;
