const express = require("express");
const router = express.Router();
const {productController} = require("./../controllers");
const {getProdCategory} = productController;

router.get("/category", getProdCategory);

module.exports = router;