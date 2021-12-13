const jwt = require("jsonwebtoken");

module.exports = {
  createTokenAccess: (data) => {
    // data ekpektasi object
    const key = "local";
    const token = jwt.sign(data, key, { expiresIn: "12h" }); // 12h
    return token;
  },

  createTokenEmailVerified: (data) => {
    const key = "tokenemailverif";
    const token = jwt.sign(data, key, { expiresIn: "3m" });
    return token;
  },
};
