const express = require("express");
const router = express.Router();
const { salesController } = require("./../controllers");
const { 
    getMonthlyRevenue, 
    getPotentialRevenue, 
    getYearlyRevenue,
    getNetSales,
    getStatusContribution, 
    getTopProdQty, 
    getTopProdVal, 
    getCategoryContribution,
    getTotalProdSold,
    getTopUsers, 
    getTotalUsers, 
    getAverageTransaction,
    getTotalOrders
} = salesController;

router.get("/monthly-revenue", getMonthlyRevenue);
router.get("/potential-revenue", getPotentialRevenue);
router.get("/yearly-revenue", getYearlyRevenue);
router.get("/net-sales", getNetSales);
router.get("/status-contribution", getStatusContribution);
router.get("/top-prod-qty", getTopProdQty);
router.get("/top-prod-val", getTopProdVal);
router.get("/category-contribution", getCategoryContribution);
router.get("/prod-sold", getTotalProdSold);
router.get("/top-users", getTopUsers);
router.get("/total-users", getTotalUsers);
router.get("/average-transaction", getAverageTransaction);
router.get("/total-orders", getTotalOrders);

module.exports = router;