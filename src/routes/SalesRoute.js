const express = require("express");
const router = express.Router();
const { salesController } = require("./../controllers");
const { 
    getMonthlyRevenue, 
    getPotentialRevenue, 
    getYearlyRevenue,
    getStatusContribution, 
    getTopProdQty, 
    getTopProdVal, 
    getTotalProdSold,
    getTopUsers, 
    getTotalUsers, 
    getCategoryContribution,
} = salesController;

router.get("/monthly-revenue", getMonthlyRevenue);
router.get("/potential-revenue", getPotentialRevenue);
router.get("/yearly-revenue", getYearlyRevenue);
router.get("/status-contribution", getStatusContribution);
router.get("/top-prod-qty", getTopProdQty);
router.get("/top-prod-val", getTopProdVal);
router.get("/prod-sold", getTotalProdSold);
router.get("/top-users", getTopUsers);
router.get("/total-users", getTotalUsers);
router.get("/category-contribution", getCategoryContribution);

module.exports = router;