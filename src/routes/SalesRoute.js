const express = require("express");
const router = express.Router();
const { salesController } = require("./../controllers");
const { getMonthlyRevenue, getPotentialRevenue } = salesController;

router.get("/monthly-revenue", getMonthlyRevenue);
router.get("/potential-revenue", getPotentialRevenue);

module.exports = router;