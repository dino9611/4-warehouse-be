const express = require("express");
const router = express.Router();
const { salesController } = require("./../controllers");
const { getMonthlyRevenue, getPotentialRevenue, getStatusContribution } = salesController;

router.get("/monthly-revenue", getMonthlyRevenue);
router.get("/potential-revenue", getPotentialRevenue);
router.get("/status-contribution", getStatusContribution);

module.exports = router;