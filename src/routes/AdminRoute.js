const express = require("express");
const router = express.Router();
const {adminController} = require("./../controllers");
const {getAdminProducts, getAdminList, addAdmin, getProdToEdit, getWarehouseProducts, getStockBreakdown} = adminController;
const { AuthControllers } = require("./../controllers");
const { adminLogin } = AuthControllers;

router.get("/product/pagination", getAdminProducts);
router.post("/login", adminLogin); // * Keep login nya ada di route /auth
router.get("/list", getAdminList);
router.post("/add", addAdmin);
router.get("/product/detail", getProdToEdit);
router.get("/warehouse-product/pagination", getWarehouseProducts);
router.get("/stock-breakdown/:prodId", getStockBreakdown);

module.exports = router;