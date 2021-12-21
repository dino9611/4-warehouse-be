const jwt = require("jsonwebtoken");

module.exports = {
  createTokenAccess: (data) => {
    // data ekpektasi object
    const key = "local";
    const token = jwt.sign(data, key, { expiresIn: "12h" }); // 12h
    return token;
  },

  createTokenEmailVerified: (data) => {
    const key = "verifEmail";
    const token = jwt.sign(data, key, { expiresIn: "1m" });
    return token;
  },
  createTokenVerified: (data) => {
    const key = "sendEmail";
    const token = jwt.sign(data, key);
    return token;
  },
};
