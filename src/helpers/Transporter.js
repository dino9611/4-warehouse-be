const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "gangsar45@gmail.com",
    pass: "lohoqaizskxqbvhb",
  },
  tls: {
    rejectUnauthorized: false,
  },
});

module.exports = transporter;
