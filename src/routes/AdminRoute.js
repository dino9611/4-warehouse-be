const express = require("express");
const router = express.Router();
const {adminController} = require("./../controllers");
const {getAdminProducts} = adminController;

router.get("/product/pagination", getAdminProducts);

module.exports = router;