const { connection } = require("./../connection");
const handlebars = require("handlebars");
const { hashPass, createToken, transporter } = require("./../helpers");
const { createTokenAccess, createTokenEmailVerified, createTokenVerified } =
  createToken;
const path = require("path");
const fs = require("fs");
const strengthPass = (password) => {
  //syarat:huruf kecil,huruf besar, angka, minimal 8 huruf,symbol
  let strengthReq = new RegExp(
    "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})"
  );
  let result = strengthReq.test(password);
  return result;
};
const validUsername = (username) => {
  let validReq = new RegExp("^(?!.* )");
  let result = validReq.test(username);
  return result;
};
const validEmail = (email) => {
  let emailreq = new RegExp("^(?=.*[@])");
  let result = emailreq.test(email);
  return result;
};

const NodeCache = require("node-cache");
const myCache = new NodeCache();

module.exports = {
  register: async (req, res) => {
    const { username, password, email } = req.body;
    const conn = await connection.promise().getConnection();

    try {
      let sql = `select id from user where username = ?`;
      const [dataUser1] = await conn.query(sql, [username]);
      sql = `select id from user where email= ? `;
      const [dataUser2] = await conn.query(sql, [email]);
      if (dataUser1.length || dataUser2.length) {
        // cek username dan email yang sama
        if (dataUser1.length && dataUser2.length) {
          console.log("Email & Username telah terdaftar");
          //throw bisa masuk di trycatch/.then
          conn.release();
          throw {
            message: "Email & Username telah terdaftar",
          };
          //cek username yang sama
        } else if (dataUser1.length) {
          console.log("Username telah Terdaftar");
          conn.release();
          throw {
            message: "Username telah Terdaftar",
          };
        } else {
          //cek email yang sama
          console.log("Email telah Terdaftar");
          conn.release();
          throw { message: "Email telah Terdaftar" };
        }
      }
      if (!validEmail(email)) {
        conn.release();
        throw {
          message: "Email tidak valid",
        };
      }
      if (!validUsername(username)) {
        conn.release();
        throw {
          message: "Username tidak boleh mengandung spasi",
        };
      }
      // proteksi strength password
      if (!strengthPass(password)) {
        console.log("Password tidak sesuai dengan ketentuan");
        conn.release();
        throw {
          message:
            "Password harus memiliki : Huruf Kecil, Huruf Besar, Angka, Minimal 8 karakter, dan Simbol",
        };
      }

      // const strength = regex.test(password);
      // console.log(strength);
      // if (password.length <= 8) {
      //   console.log("password lemah");
      //   return res.send({ message: "password lemah" });
      // } else if (password) {
      // }

      console.log(username, "username belum terdaftar");
      //insert data to database
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
        email: userData[0].email,
        created: new Date().getTime(),
      };
      conn.release();
      //set data untuk verif
      myCache.set(userData[0].id, dataToken, 250);
      const emailToken = createTokenEmailVerified(dataToken);
      const accessToken = createTokenAccess(dataToken);
      const sendEmail = createTokenVerified(dataToken);
      let filepath = path.resolve(__dirname, "../template/VerifyEmail.html");
      // console.log(filepath);
      // ubah html jadi string pake fs.readfile
      let htmlString = fs.readFileSync(filepath, "utf-8");
      const template = handlebars.compile(htmlString);
      const htmlToEmail = template({
        nama: username,
        token: emailToken,
        sendToken: sendEmail,
      });
      console.log(htmlToEmail);
      // email with template html
      transporter.sendMail({
        from: "Admin <gangsar45@gmail.com>",
        to: email,
        subject: "Email verifikasi",
        html: htmlToEmail,
      });
      res.set("x-token-access", accessToken);
      return res.status(200).send({ token: accessToken, data: userData[0] });
    } catch (error) {
      conn.release();
      console.log(error);
      return res.status(500).send({ message: error.message || "server eror" });
    }
  },
  login: async (req, res) => {
    const { username, password } = req.body;
    const conn = await connection.promise().getConnection();

    try {
      let sql = `select id,username,email,is_verified,role_id,profile_picture from user where (username = ? or email = ?) and password = ?`;
      const [userData] = await conn.query(sql, [
        username,
        username,
        hashPass(password),
      ]);
      if (!userData.length) {
        throw { message: "Username/Email Tidak Ditemukan" };
      }
      if (userData[0].is_verified === 0) {
        throw {
          message:
            "Akun Anda belum di Verifikasi, Tolong cek Email untuk Verifikasi",
        };
      }

      const dataToken = {
        id: userData[0].id,
        username: userData[0].username,
        role_id: userData[0].role_id,
      };
      //proteksi kalo belom verif gaboleh login
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
    const { id, role_id } = req.user;
    const conn = await connection.promise().getConnection();

    try {
      let sql = `select id,username,email,is_verified,role_id, profile_picture from user where id = ?`;

      if (role_id !== 3) {
        // Tambahan utk super admin & wh admin, karena butuh warehouse_id
        sql = `
          SELECT u.id, u.username, u.email, u.is_verified, u.role_id, wa.warehouse_id, w.name AS warehouse_name FROM user AS u
          LEFT JOIN warehouse_admin wa
          ON u.id = wa.user_id
          LEFT JOIN warehouse w
          ON wa.warehouse_id = w.id
          WHERE u.id = ?;
        `;
      } else {
        sql = `select id,username,email,is_verified,role_id from user where id = ?`;
      }
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
  verifyEmail: async (req, res) => {
    const { id, created } = req.user;
    const conn = await connection.promise().getConnection();

    try {
      //untuk get data yang tadi di set
      const value = myCache.get(id);
      //cek cache yang di get tidak sesuai
      if (!value) {
        throw { message: "data tidak sesuai" };
      }
      //cek waktu pembuatan token sama atau ngga
      if (created !== value.created) {
        throw { message: "token kadaluwarsa" };
      }
      let updateData = {
        is_verified: 1,
      };
      //update data di database
      let sql = `update user set ? where id = ?`;
      await conn.query(sql, [updateData, id]);
      //hapus yang ada di cache kalau verifynya berhasil
      myCache.del(id);
      // proteksi kalo udh verif
      conn.release();
      // let [userData] = await conn.query(sql, [id]);
      return res.status(200).send({ message: "Verifikasi berhasil " });
    } catch (error) {
      console.log(error);
      conn.release();
      return res.status(500).send({ message: error.message || "server eror" });
    }
  },
  sendVerifyEmail: async (req, res) => {
    const { id, email, username, role_id } = req.user;
    const dataToken = {
      id: id,
      username: username,
      role_id: role_id,
      email: email,
      created: new Date().getTime(),
    };
    const conn = await connection.promise().getConnection();
    myCache.set(dataToken.id, dataToken, 250);
    try {
      const value = myCache.get(dataToken.id);
      if (!value) {
        throw { message: "data tidak sesuai" };
      }
      const emailToken = createTokenEmailVerified(dataToken);
      const sendEmail = createTokenVerified(dataToken);
      let filepath = path.resolve(__dirname, "../template/VerifyEmail.html");
      // console.log(filepath);
      // ubah html jadi string pake fs.readfile
      let htmlString = fs.readFileSync(filepath, "utf-8");
      const template = handlebars.compile(htmlString);
      const htmlToEmail = template({
        nama: username,
        token: emailToken,
        sendToken: sendEmail,
      });
      console.log(htmlToEmail);
      // email with template html
      transporter.sendMail({
        from: "Admin <gangsar45@gmail.com>",
        to: dataToken.email,
        subject: "Email verifikasi",
        html: htmlToEmail,
      });

      return res
        .status(200)
        .send({ message: "Email verifikasi berhasil dikirim" });
    } catch (error) {
      console.log(error);
      conn.release();
      return res.status(500).send({ message: error.message || "server eror" });
    }
  },
  adminLogin: async (req, res) => {
    const { inputtedUsername, inputtedPassword } = req.body;
    const conn = await connection.promise().getConnection();

    try {
      let sql = `
              SELECT u.id, u.username, u.email, u.is_verified, u.role_id, wa.warehouse_id, w.name AS warehouse_name FROM user AS u
              LEFT JOIN warehouse_admin wa
              ON u.id = wa.user_id
              LEFT JOIN warehouse w
              ON wa.warehouse_id = w.id
              WHERE username = ? and password = ?;
            `;
      const [userData] = await conn.query(sql, [
        inputtedUsername,
        // inputtedPassword,
        // ! Khusus sesi testing gunakan tanpa hash karena blm byk dummy data password nya pake hashpass, dapat menyebabkan salah matching password dgn db
        hashPass(inputtedPassword),
      ]);

      if (!userData.length) {
        conn.release();
        return res.send({ message: "Incorrect Username/Password!" }); // * Klo kyk gini bisa dapet di try
        // throw { message: "Username/Password incorrect" }; // * Klo yg ini harus di catch
      }
      const dataToken = {
        id: userData[0].id,
        username: userData[0].username,
        role_id: userData[0].role_id,
        warehouse_id: userData[0].warehouse_id,
        warehouse_name: userData[0].warehouse_name,
      };

      const accessToken = createTokenAccess(dataToken);
      res.set("x-token-access", accessToken);
      conn.release();
      return res.status(200).send({ ...userData[0] });
    } catch (error) {
      conn.release();
      console.log(error);
      return res.status(500).send({ message: error.message || "Server Error" });
    }
  },
};
