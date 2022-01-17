const express = require("express");
const router = express.Router();
const { userControllers } = require("./../controllers");
const {
  getAddress,
  chooseDefaultAddress,
  inputAddress,
  deleteAddress,
  editAddress,
  getProvince,
  getcity,
} = userControllers;

router.patch("/default-address/:idAddress", chooseDefaultAddress);
router.get("/address/province", getProvince);
router.get("/address/city/:province", getcity);
router.get("/address/:userId", getAddress);
router.post("/address/:userId", inputAddress);
router.delete("/address/delete/:addressId", deleteAddress);
router.patch("/address/edit/:addressId", editAddress);

module.exports = router;