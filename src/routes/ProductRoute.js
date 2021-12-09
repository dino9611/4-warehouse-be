const express = require("express");
const router = express.Router();
const {productController} = require("./../controllers");
const {getProdCategory, addProduct} = productController;

router.get("/category", getProdCategory);
router.post("/add", addProduct);

module.exports = router;