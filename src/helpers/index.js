const hashPass = require("./HashPass");
const createToken = require("./CreateToken");
const transporter = require("./Transporter");
const verifyToken = require("./VerifyToken");
// const verifyEmailToken = require("./VerifyEmailToken");
const verifyEmailToken = require("./VerifyToken");
const uploader = require("./Uploader");
const verifyPass = require("./VerifyPass");
const createTokenForgetPass = require("./CreateTokenForgetPass");
const verifyTokenForgetPass = require("./VerifyTokenForgetPass");

module.exports = {
  hashPass,
  createToken,
  transporter,
  verifyToken,
  uploader,
  verifyPass,
  createTokenForgetPass,
  verifyTokenForgetPass,
};
