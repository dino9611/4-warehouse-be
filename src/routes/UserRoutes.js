const express = require("express");
const router = express.Router();
const { userControllers } = require("./../controllers");
const {
  getAddress,
  chooseDefaultAddress,
  inputAddress,
  deleteAddress,
  editAddress,
} = userControllers;

router.patch("/default-address/:idAddress", chooseDefaultAddress);
router.get("/address/:userId", getAddress);
router.post("/address/:userId", inputAddress);
router.delete("/address/delete/:addressId", deleteAddress);
router.patch("/address/edit/:addressId", editAddress);

module.exports = router;
