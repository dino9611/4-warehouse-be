const { connection } = require("./../connection");
const handlebars = require("handlebars");
const { hashPass, createToken, transporter } = require("./../helpers");
const { createTokenAccess, createTokenEmailVerified } = createToken;
const path = require("path");
const fs = require("fs");

module.exports = {
  register: async (req, res) => {
    const { username, password, email } = req.body;
    const conn = await connection.promise().getConnection();

    try {
      let sql = `select id from user where username = ?`;
      const [dataUser] = await conn.query(sql, [username]);
      if (dataUser.length) {
        //cek username yang sama
        throw { message: "username telah terdaftar" };
      }
      console.log(username, "username belum terdaftar");
      sql = `insert into user set ?`;
      let dataInsert = {
        username,
        password: hashPass(password),
        email,
      };
      const [result] = await conn.query(sql, [dataInsert]);

      sql = `select id,username,email,is_verified,role_id from user where id = ?`;
      const [userData] = await conn.query(sql, [result.insertId]);
      const dataToken = {
        id: userData[0].id,
        username: userData[0].username,
        role_id: userData[0].role_id,
      };
      conn.release();
      const emailToken = createTokenEmailVerified(dataToken);
      const accessToken = createTokenAccess(dataToken);
      let filepath = path.resolve(__dirname, "../template/EmailVerif.html");
      // console.log(filepath);
      // ubah html jadi string pake fs.readfile
      let htmlString = fs.readFileSync(filepath, "utf-8");
      const template = handlebars.compile(htmlString);
      const htmlToEmail = template({
        nama: username,
        token: emailToken,
      });
      console.log(htmlToEmail);
      // email with tamplate html
      transporter.sendMail({
        from: "Admin <taurankevin245@gmail.com>",
        to: email,
        subject: "Email verifikasi",
        html: htmlToEmail,
      });
      res.set("x-token-access", accessToken);
      return res.status(200).send({ ...userData[0] });
    } catch (error) {
      conn.release();
      console.log(error);
      return res.status(500).send({ message: error.message || "server eror" });
    }
  },
  login: async (req, res) => {
    const { username, password, email } = req.body;
    const conn = await connection.promise().getConnection();

    try {
      let sql = `select id,username,email,is_verified,role_id from user where username = ? or email = ? and password = ?`;
      const [userData] = await conn.query(sql, [
        username,
        email,
        hashPass(password),
      ]);
      if (!userData.length) {
        throw { message: "username tidak ditemukan" };
      }
      const dataToken = {
        id: userData[0].id,
        username: userData[0].username,
        role_id: userData[0].role_id,
      };

      const accessToken = createTokenAccess(dataToken);
      res.set("x-token-access", accessToken);
      return res.status(200).send({ ...userData[0] });
    } catch (error) {
      conn.release();
      console.log(error);
      return res.status(500).send({ message: error.message || "server eror" });
    }
  },
  keeplogin: async (req, res) => {
    const { id } = req.user;
    const conn = await connection.promise().getConnection();

    try {
      let sql = `select id,username,email,is_verified,role_id from user where id = ?`;
      const [userData] = await conn.query(sql, [id]);
      if (!userData.length) {
        throw { message: "username tidak ditemukan" };
      }

      return res.status(200).send({ ...userData[0] });
    } catch (error) {
      conn.release();
      console.log(error);
      return res.status(500).send({ message: error.message || "server eror" });
    }
  },
};
