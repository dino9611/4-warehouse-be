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
  getAllTransactions,
  getWaitPayTransactions,
  getWaitConfirmTrans,
  getOnProcessTrans,
  getDelivTransactions,
  getReceivedTransactions,
  getFailTransactions,
  getTransactionDetail,
  getShippingInfo,
  confirmRejectTransactionPay,
  confirmRejectTransactionDelivery,
  getTransactionStatuses,
  getPaymentProof,
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
router.get("/all-transactions", getAllTransactions);
router.get("/wait-pay-transactions", getWaitPayTransactions);
router.get("/wait-confirm-transactions", getWaitConfirmTrans);
router.get("/onprocess-transactions", getOnProcessTrans);
router.get("/delivery-transactions", getDelivTransactions);
router.get("/received-transactions", getReceivedTransactions);
router.get("/fail-transactions", getFailTransactions);
router.get("/detail", getTransactionDetail);
router.get("/detail-shipping", getShippingInfo);
router.patch("/confirm-payment/:transactionId", confirmRejectTransactionPay);
router.patch(
  "/confirm-delivery/:transactionId",
  confirmRejectTransactionDelivery
);
router.get("/statuses", getTransactionStatuses);
router.get("/payment-proof/:orderId", getPaymentProof);

module.exports = router;
