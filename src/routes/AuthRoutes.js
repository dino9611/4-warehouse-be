const express = require("express");
const { VerifyTokenAccess } = require("../helpers/VerifyToken");
const router = express.Router();
const { AuthControllers } = require("./../controllers");

const { register, login, keeplogin } = AuthControllers;

router.post("/register", register);
router.post("/login", login);
router.get("/keeplogin", VerifyTokenAccess, keeplogin);

module.exports = router;
