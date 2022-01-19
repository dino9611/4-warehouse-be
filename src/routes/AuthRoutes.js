const express = require("express");
const { verifyToken } = require("../helpers");

const { VerifyTokenAccess, VerifyEmailToken, SendEmailVerif } = verifyToken;
const router = express.Router();
const { AuthControllers } = require("./../controllers");
const verifyTokenForgetPass = require("./../helpers/VerifyTokenForgetPass");

const {
  register,
  login,
  keeplogin,
  verifyEmail,
  sendVerifyEmail,
  checkEmail,
  verifyForgetPass,
  forgetPassword,
} = AuthControllers;

router.post("/register", register);
router.post("/login", login);
router.get("/keeplogin", VerifyTokenAccess, keeplogin);
router.get("/verified", VerifyEmailToken, verifyEmail);
router.get("/send-email", SendEmailVerif, sendVerifyEmail);
router.patch("/check-email", checkEmail);
router.get("/verify/forget-pass", verifyTokenForgetPass, verifyForgetPass);
router.patch("/reset-password", forgetPassword);

module.exports = router;
