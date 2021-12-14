const jwt = require("jsonwebtoken");

module.exports.VerifyTokenAccess = (req, res, next) => {
  const token = req.token;
  const key = "local";
  jwt.verify(token, key, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "user unauthorized" });
    }
    req.user = decoded;
    next();
  });
};

module.exports.VerifyEmailToken = (req, res, next) => {
  console.log("token", req.token);
  const token = req.token;
  const key = "random";
  jwt.verify(token, key, (err, decoded) => {
    if (err) {
      console.log(err);
      return res.status(401).send({ message: "user unauthorized" });
    }
    console.log(decoded);
    req.user = decoded;
    next();
  });
};
