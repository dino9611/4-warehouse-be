require("dotenv").config();

const jwt = require("jsonwebtoken");

const verifyTokenChangeEmail = (req, res, next) => {
  jwt.verify(req.token, process.env.JWT_KEY, (err, decoded) => {
    if (err) return res.status(401).send({ message: "Token expired" });

    req.user = decoded;

    next();
  });
};

module.exports = verifyTokenChangeEmail;
