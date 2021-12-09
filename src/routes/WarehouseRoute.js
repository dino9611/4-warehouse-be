const express = require("express");
const router = express.Router();
const {warehouseController} = require("./../controllers");
const {getWarehouse} = warehouseController;

router.get("/list", getWarehouse);

module.exports = router;