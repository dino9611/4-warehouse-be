const express = require("express");
const router = express.Router();
const { salesController } = require("./../controllers");
const { getRevenue } = salesController;

router.get("/revenue", getRevenue);

module.exports = router;