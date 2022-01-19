require("dotenv").config();

const jwt = require("jsonwebtoken");

const createTokenForgetPass = (data) => {
  return jwt.sign(data, process.env.JWT_KEY, { expiresIn: "5m" });
};

module.exports = createTokenForgetPass;
