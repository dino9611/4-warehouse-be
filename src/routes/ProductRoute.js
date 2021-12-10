const express = require("express");
const router = express.Router();
const {productController} = require("./../controllers");
const {getProdCategory, addProduct} = productController;
const uploader = require("../helpers/Uploader");

const uploadFile = uploader("/uploaded", "Product_").fields([ // Gunakan fields bila ingin > 1 upload file, klo 1 pake .single
    {name: "images", maxCount: 3} // Key harus sama dengan yg dikirimkan dari body
])

router.get("/category", getProdCategory);
router.post("/add", uploadFile, addProduct);

module.exports = router;