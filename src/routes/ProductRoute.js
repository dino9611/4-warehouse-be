const express = require("express");
const router = express.Router();
const { productController } = require("./../controllers");
const { listProduct, getCategory } = productController;

router.get("/", listProduct);
router.get("/list-category", getCategory);

module.exports = router;
