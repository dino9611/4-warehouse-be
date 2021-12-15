const { connection } = require("./../connection");
const handlebars = require("handlebars");
const { hashPass, createToken, transporter } = require("./../helpers");
const { createTokenAccess, createTokenEmailVerified } = createToken;
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
          throw {
            message: "Email & Username telah terdaftar",
          };
          //cek username yang sama
        } else if (dataUser1.length) {
          console.log("Username telah Terdaftar");
          throw {
            message: "Username telah Terdaftar",
          };
        } else {
          //cek email yang sama
          console.log("Email telah Terdaftar");
          throw { message: "Email telah Terdaftar" };
        }
      }
      //proteksi strength password
      if (!strengthPass(password)) {
        console.log("Password tidak sesuai dengan ketentuan");
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
    const { username, password } = req.body;
    const conn = await connection.promise().getConnection();

    try {
      let sql = `select id,username,email,is_verified,role_id from user where (username = ? or email = ?) and password = ?`;
      const [userData] = await conn.query(sql, [
        username,
        username,
        hashPass(password),
      ]);
      if (!userData.length) {
        throw { message: "Username/Email Not Found" };
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
  adminLogin: async (req, res) => {
      const { inputtedUsername, inputtedPassword } = req.body;
      const conn = await connection.promise().getConnection();

      try {
        let sql = `
              SELECT id, username, email, is_verified, role_id FROM user 
              WHERE username = ? and password = ?;
            `;
        const [userData] = await conn.query(sql, [
            inputtedUsername,
            inputtedPassword 
            // ! Khusus sesi testing gunakan tanpa hash karena blm byk dummy data password nya pake hashpass, dapat menyebabkan salah matching password dgn db
            // hashPass(inputtedPassword) 
        ]);
        console.log(userData);
        
        if (!userData.length) {
          conn.release();
          return res.send({message: "Incorrect Username/Password!"}) // * Klo kyk gini bisa dapet di try
          // throw { message: "Username/Password incorrect" }; // * Klo yg ini harus di catch
        }
        const dataToken = {
          id: userData[0].id,
          username: userData[0].username,
          role_id: userData[0].role_id,
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
  }
};
