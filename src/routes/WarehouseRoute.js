const express = require("express");
const router = express.Router();
const {warehouseController} = require("./../controllers");
const {getWarehouse, addWarehouse, getProvinceAdmin, getCityAdmin} = warehouseController;

router.get("/list", getWarehouse);
router.post("/add", addWarehouse);
router.get("/province", getProvinceAdmin);
router.get("/city/:province", getCityAdmin);

module.exports = router;