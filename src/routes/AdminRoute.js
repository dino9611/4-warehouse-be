const express = require("express");
const router = express.Router();
const {adminController} = require("./../controllers");
const {getAdminProducts} = adminController;
const { VerifyTokenAccess } = require("../helpers/VerifyToken");
const { AuthControllers } = require("./../controllers");
const { adminLogin, keeplogin } = AuthControllers;

router.get("/product/pagination", getAdminProducts);
router.post("/login", adminLogin); // * Keep login nya ada di route /auth

module.exports = router;