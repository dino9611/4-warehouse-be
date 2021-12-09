const express = require("express");
const router = express.Router();
const { productController } = require("./../controllers");
const { getProduct, getCategory } = productController;

router.get("/", getProduct);
router.get("/list-category", getCategory);

module.exports = router;
