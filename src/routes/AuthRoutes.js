const express = require("express");
const { verifyToken } = require("../helpers");

const { VerifyTokenAccess, VerifyEmailToken, SendEmailVerif } = verifyToken;
const router = express.Router();
const { AuthControllers } = require("./../controllers");

const { register, login, keeplogin, verifyEmail, sendVerifyEmail } =
  AuthControllers;

router.post("/register", register);
router.post("/login", login);
router.get("/keeplogin", VerifyTokenAccess, keeplogin);
router.get("/verified", VerifyEmailToken, verifyEmail);
router.get("/send-email", SendEmailVerif, sendVerifyEmail);

module.exports = router;
