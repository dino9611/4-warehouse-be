require("dotenv").config();

const jwt = require("jsonwebtoken");

const createTokenChangeEmail = (data) => {
  return jwt.sign(data, process.env.JWT_KEY, { expiresIn: "12h" });
};

module.exports = createTokenChangeEmail;
