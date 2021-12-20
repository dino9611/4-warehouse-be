const express = require("express");
const router = express.Router();
const {uploader, verifyPass} = require("../helpers/");
const { connection } = require("../connection");
const { productController } = require("./../controllers");
const { getProdCategory, addProduct, editProdNoImg, editProdImg, listProduct, deleteProduct } = productController;

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
  // Utk menentukan route folder uploaded product image by category
  const conn = await connection.promise().getConnection();
  // console.log("Line 42: ", req.headers.image_to_del);
  // console.log("Line 43: ", parseInt(req.headers.img_del_index));
  const { category_id } = req.headers;
  // console.log("Masuk check edit cat folder");
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
  // console.log("Masuk upload file edit");
  // console.log("line 63: ", req.categoryFolder);
  let upload = uploader(req.categoryFolder, "Product_").fields([
    { name: "images", maxCount: 3 }, // Key harus sama dengan yg dikirimkan dari body (FE)
  ]);
  upload(req, res, (error) => {
    if (error) {
      console.log(error);
    } else {
      next();
    };
  });
};

router.get("/category", getProdCategory);
router.post("/determine-category", checkCategoryFolder);
router.post("/add", uploadFile, addProduct(categoryFolder));
router.patch("/edit/:id", editProdNoImg);
router.patch("/edit/image/:id", editImgCatFolder, uploadEditImg, editProdImg);
router.get("/", listProduct);
router.delete("/delete/:prodId", verifyPass, deleteProduct);

module.exports = router;

// ? Notes discuss w/ Dino
// Ganti image
// Ada 1 array tambahan isi nya kosong --> gimana cara tau yg diubah apa?
// Nyimpen data nya array of object, karena JSON ga bisa satu2 diubah nya, lsg sekaligus diubah semua
// Misal mau rubah yg kedua
// Pisah controller, ngubah foto lsg upload, kyk profile picture, klik lsg ganti
// Parameter di body, index keberapa, lsg diganti 
// Ada tombol delete utk foto 2 & 3
// Edit stok kepisah sendiri menu nya

// Edit stock
// Masuk menjadi row record baru

// Misal edit foto, utk foto 2/3 pilih edit/delete
// Pisahin endpoint khusus edit foto
// Cara ngeditnya --> tergantung tampilan, cara tergampang, kasih modal buat foto baru (klik)
// Klo ga mau pake modal, delete dlu di database, 
// Klo edit paling gampang pake modal kecil buat naro foto baru nya
// Nyari index bisa dari nama fotonya
// Dari frontend kasih looping 
//  Klo delete yg tengah2, bisa jg nnti geser fotonya
// Cara delete image, pake unlink fs, kemudian public/bla bla bla