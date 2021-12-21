const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "gangsar45@gmail.com", // generated ethereal user
    pass: "lohoqaizskxqbvhb", // generated ethereal password
  },
  tls: {
    rejectUnauthorized: false,
  },
});

module.exports = transporter;
