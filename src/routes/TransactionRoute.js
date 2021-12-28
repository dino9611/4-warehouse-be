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
  getAllTransactions,
  getWaitPayTransactions,
  getWaitConfirmTrans,
  getOnProcessTrans,
  getDelivTransactions,
  getReceivedTransactions,
  getFailTransactions,
} = transactionController;

router.post("/addtocart", addToCart);
router.get("/get/cart-detail/:userId", getCartDetail);
router.patch("/delete/cart-detail/:cartDetailId", deleteProductInCart);
router.patch("/edit/cart-detail/:cartDetailId", editQtyInCart);
router.post(`/checkout`, checkout);
router.get("/check-stock/:userId", checkStock);
router.get("/get/bank", getBank);
router.get("/all-transactions", getAllTransactions);
router.get("/wait-pay-transactions", getWaitPayTransactions);
router.get("/wait-confirm-transactions", getWaitConfirmTrans);
router.get("/onprocess-transactions", getOnProcessTrans);
router.get("/delivery-transactions", getDelivTransactions);
router.get("/received-transactions", getReceivedTransactions);
router.get("/fail-transactions", getFailTransactions);

module.exports = router;