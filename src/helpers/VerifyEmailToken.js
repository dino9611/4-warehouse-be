const jwt = require("jsonwebtoken");

const verifyEmailToken = (req, res, next) => {
  const token = req.token;
  const key = "tokenemailverif";
  jwt.verify(token, key, (error, decoded) => {
    if (error) {
      return res.status(401).send({ message: "Unauthorized/token expired" });
    }
    req.user = decoded;
    next();
  });
};

module.exports = verifyEmailToken;
