const express = require("express");
const router = express.Router();
const { userControllers } = require("./../controllers");
const { getAddress, chooseDefaultAddress, inputAddress } = userControllers;

router.patch("/default-address/:idAddress", chooseDefaultAddress);
router.get("/address/:userId", getAddress);
router.post("/address", inputAddress);

module.exports = router;
