const express = require("express");
const router = express.Router();
const { salesController } = require("./../controllers");
const { getMonthlyRevenue, getPotentialRevenue, getStatusContribution, getTopProdQty, getTopProdVal, getTopUsers } = salesController;

router.get("/monthly-revenue", getMonthlyRevenue);
router.get("/potential-revenue", getPotentialRevenue);
router.get("/status-contribution", getStatusContribution);
router.get("/top-prod-qty", getTopProdQty);
router.get("/top-prod-val", getTopProdVal);
router.get("/top-users", getTopUsers);

module.exports = router;