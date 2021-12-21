const jwt = require("jsonwebtoken");

module.exports.VerifyTokenAccess = (req, res, next) => {
  const token = req.token;
  const key = "local"; // kata kunci terserah tetapi harus sama dengan createtokennya

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
  const key = "verifEmail"; // kata kunci terserah
  jwt.verify(token, key, (err, decoded) => {
    if (err) {
      console.log(err);
      return res.status(401).send({ message: "Token Kadaluwarsa" });
    }
    console.log(decoded);
    req.user = decoded;
    next();
  });
};
module.exports.SendEmailVerif = (req, res, next) => {
  console.log("token", req.token);
  const token = req.token;
  const key = "sendEmail"; // kata kunci terserah
  jwt.verify(token, key, (err, decoded) => {
    if (err) {
      console.log(err);
      return res.status(401).send({ message: "Token Kadaluwarsa" });
    }
    console.log(decoded);
    req.user = decoded;
    next();
  });
};
