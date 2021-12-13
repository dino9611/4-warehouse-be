const express = require("express");
const router = express.Router();
const { connection } = require("../connection");
const {productController} = require("./../controllers");
const {getProdCategory, addProduct} = productController;
const uploader = require("../helpers/Uploader");

let categoryFolder = [""]; // Variabel utk simpan route folder uploaded product image

const checkCategoryFolder = async (req, res, next) => { // Utk menentukan route folder uploaded product image by category
    const conn = await connection.promise().getConnection();
    const {prod_category} = req.body;

    try {
        let sql = `SELECT category FROM category WHERE id = ?;`;

        const categoryResult = await conn.query(sql, prod_category);
        
        conn.release();
        return categoryFolder[0] = categoryResult[0][0].category.toLowerCase().replace(/-/g, '_'); // lowercase all & regex rubah "-" jd "_"
    } catch (error) {
        conn.release();
        console.log(error);
        return res.status(500).send({ message: error.message || "Server error" });
    } finally {
        next();
    };
};

const uploadFile = uploader(categoryFolder, "Product_").fields([ // Gunakan fields bila ingin > 1 upload file, klo 1 pake .single
    {name: "images", maxCount: 3} // Key harus sama dengan yg dikirimkan dari body (FE)
]);

router.get("/category", getProdCategory);
router.post("/determine-category", checkCategoryFolder);
router.post("/add", uploadFile, addProduct(categoryFolder));

module.exports = router;