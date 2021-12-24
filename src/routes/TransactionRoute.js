const express = require("express");
const router = express.Router();
const { transactionController } = require("./../controllers");
const {
  addToCart,
  getCartDetail,
  deleteProductInCart,
  editQtyInCart,
  checkout,
  checkStock,
  getBank,
} = transactionController;

router.post("/addtocart", addToCart);
router.get("/get/cart-detail/:userId", getCartDetail);
router.patch("/delete/cart-detail/:cartDetailId", deleteProductInCart);
router.patch("/edit/cart-detail/:cartDetailId", editQtyInCart);
router.post(`/checkout`, checkout);
router.get("/check-stock/:userId", checkStock);
router.get("/get/bank", getBank);

module.exports = router;
