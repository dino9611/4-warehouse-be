const express = require("express");
const router = express.Router();
const { uploader, verifyPass } = require("../helpers/");
const { connection } = require("../connection");
const { productController } = require("./../controllers");
const {
  getProdCategory,
  addProduct,
  editProdNoImg,
  editProdImg,
  deleteProdImg,
  listProduct,
  deleteProduct,
  getDetailedProduct,
} = productController;

let categoryFolder = [""]; // Variabel utk simpan route folder uploaded product image

const checkCategoryFolder = async (req, res, next) => {
  // Utk menentukan route folder uploaded product image by category
  const conn = await connection.promise().getConnection();
  const { prod_category } = req.body;

  try {
    let sql = `SELECT category FROM category WHERE id = ?;`;

    const categoryResult = await conn.query(sql, prod_category);

    conn.release();
    return (categoryFolder[0] = categoryResult[0][0].category
      .toLowerCase()
      .replace(/-/g, "_")); // lowercase all & regex rubah "-" jd "_"
  } catch (error) {
    conn.release();
    console.log(error);
    return res.status(500).send({ message: error.message || "Server error" });
  } finally {
    next();
  }
};

const uploadFile = uploader(categoryFolder, "Product_").fields([
  // Gunakan fields bila ingin > 1 upload file, klo 1 pake .single
  { name: "images", maxCount: 3 }, // Key harus sama dengan yg dikirimkan dari body (FE)
]);

const editImgCatFolder = async (req, res, next) => {
  // Utk menentukan route folder uploaded edit product image by category
  const conn = await connection.promise().getConnection();
  const { category_id } = req.headers;
  try {
    let sql = `SELECT category FROM category WHERE id = ?;`;

    const categoryResult = await conn.query(sql, category_id);

    conn.release();
    req.categoryFolder = categoryResult[0][0].category
      .toLowerCase()
      .replace(/-/g, "_"); // lowercase all & regex rubah "-" jd "_"
    next();
  } catch (error) {
    conn.release();
    console.log(error);
    return res.status(500).send({ message: error.message || "Server error" });
  }
};

const uploadEditImg = (req, res, next) => {
  // Middleware utk proses upload file edit image product
  let upload = uploader(req.categoryFolder, "Product_").fields([
    { name: "images", maxCount: 3 }, // Key harus sama dengan yg dikirimkan dari body (FE)
  ]);
  upload(req, res, (error) => {
    if (error) {
      console.log(error);
    } else {
      next();
    }
  });
};

router.get("/category", getProdCategory);
router.post("/determine-category", checkCategoryFolder);
router.post("/add", uploadFile, addProduct(categoryFolder));
router.patch("/edit/:id", editProdNoImg);
router.patch("/edit/image/:id", editImgCatFolder, uploadEditImg, editProdImg);
router.delete("/delete/image/:id", deleteProdImg);
router.get("/", listProduct);
router.get("/detailed-product/:productId", getDetailedProduct);
router.delete("/delete/:prodId", verifyPass, deleteProduct);

module.exports = router;
