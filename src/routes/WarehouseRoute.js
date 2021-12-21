const express = require("express");
const router = express.Router();
const {warehouseController} = require("./../controllers");
const {getWarehouse, addWarehouse} = warehouseController;

router.get("/list", getWarehouse);
router.post("/add", addWarehouse);

module.exports = router;