const express = require("express");
const router = express.Router();
const { locationController } = require("./../controllers");
const {
  shippingFee,
  getMainAddress,
  getAddressuser,
  changeMainAddress,
  getProvince,
  getcity,
  addNewAddress,
} = locationController;

router.get(`/shipping-fee/:addressId`, shippingFee);
router.get(`/get/main-address/:userId`, getMainAddress);
router.get("/get/data-address/:userId", getAddressuser);
router.patch("/edit/main-address", changeMainAddress);
router.get("/get/province", getProvince);
router.get("/get/city/:province", getcity);
router.post("/add/new-address", addNewAddress);

module.exports = router;
