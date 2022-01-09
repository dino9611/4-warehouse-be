const express = require("express");
const router = express.Router();
const uploader = require("./../helpers/Uploader");
const { transactionController } = require("./../controllers");
const {
  addToCart,
  getCartDetail,
  deleteProductInCart,
  editQtyInCart,
  checkout,
  checkStock,
  getBank,
  getTotalItemInCart,
  uploadPaymentProof,
  getDataOrders,
} = transactionController;

const uploadFile = uploader("/payment-proof", "PAY").fields([
  { name: "image", maxCount: 3 },
]);

router.post("/addtocart", addToCart);
router.get("/get/cart-detail/:userId", getCartDetail);
router.patch("/delete/cart-detail/:cartDetailId", deleteProductInCart);
router.patch("/edit/cart-detail/:cartDetailId", editQtyInCart);
router.post(`/checkout`, checkout);
router.get("/check-stock/:userId", checkStock);
router.get("/get/bank", getBank);
router.get("/get/total-item/:userId", getTotalItemInCart);
router.patch("/upload/payment-proof/:ordersId", uploadFile, uploadPaymentProof);
router.get("/get/orders/:ordersId", getDataOrders);

module.exports = router;
