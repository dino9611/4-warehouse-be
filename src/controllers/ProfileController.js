const { connection } = require("./../connection");
const hashPass = require("../helpers/HashPass");
const createTokenChangeEmail = require("../helpers/createTokenChangeEmail");
const transporter = require("./../helpers/Transporter");
const fs = require("fs");
const path = require("path");
const handleBars = require("handlebars");

module.exports = {
  getPersonalData: async (req, res) => {
    const connDb = connection.promise();

    try {
      let sql = `select username, first_name, profile_picture, last_name, email, phone_number, gender, date_of_birth from user where id = ?`;
      let [personalData] = await connDb.query(sql, [req.params.userId]);

      return res.status(200).send(personalData);
    } catch (error) {
      console.log(error);
      res.status(500).send({ message: error.message });
    }
  },

  inputPersonalData: async (req, res) => {
    const connDb = await connection.promise().getConnection();

    try {
      let sql = `select profile_picture from user where id = ?`;
      let [profPic] = await connDb.query(sql, req.params.userId);

      let imagePath;

      if (!req.files.image) {
        imagePath = req.body.data.profile_picture;

        if (profPic[0].profile_picture) {
          fs.unlinkSync("./public" + profPic[0].profile_picture);
        }
      } else {
        if (profPic[0].profile_picture) {
          fs.unlinkSync("./public" + profPic[0].profile_picture);
        }

        const path = "/assets/images/uploaded/photo-profile";

        imagePath = req.files.image
          ? `${path}/${req.files.image[0].filename}`
          : null;
      }

      let data = JSON.parse(req.body.data);

      const dataInput = {
        ...data,
        profile_picture: imagePath,
      };

      sql = `update user set ? where id = ? and role_id = 3`;
      let [dataUser] = await connDb.query(sql, [dataInput, req.params.userId]);

      return res.status(200).send({ message: imagePath });
    } catch (error) {
      console.log(error);
      connDb.release();
      return res.status(500).send({ message: error.message });
    }
  },

  changePassword: async (req, res) => {
    const connDb = await connection.promise().getConnection();

    try {
      if (!req.body.currentPass && !req.body.newPass) {
        throw { message: "Password harus diisi!" };
      }

      let sql = `select id from user where password = ? and role_id = 3`;
      let [cekPass] = await connDb.query(sql, [hashPass(req.body.currentPass)]);
      console.log(cekPass);
      if (!cekPass.length) {
        return res.send(cekPass);
      }

      sql = `update user set password = ? where id = ? and role_id = 3`;
      await connDb.query(sql, [hashPass(req.body.newPass), req.params.userId]);

      connDb.release();

      return res.status(200).send(cekPass);
    } catch (error) {
      connDb.release();
      return res.status(500).send({ message: error.message });
    }
  },

  onChangeEmail: async (req, res) => {
    const connDb = await connection.promise().getConnection();

    try {
      if (!req.body.password && !req.body.email) {
        throw { message: "Data harus diisi lengkap" };
      }

      let sql = `select id from user where password = ? and role_id = 3`;
      let [cekPass] = await connDb.query(sql, [req.body.password]);

      if (!cekPass.length) {
        return res.send(cekPass);
      }

      dataToken = {
        id: cekPass[0].id,
        email: req.body.email,
      };

      let token = createTokenChangeEmail(dataToken);

      res.set("x-token-email", token);

      let filepath = path.resolve(
        __dirname,
        "./../template/VerifyChangeEmail.html"
      );

      let htmlString = fs.readFileSync(filepath, "utf-8");
      const template = handleBars.compile(htmlString);
      const htmlToEmail = template({ text: "Ubah Password", token });

      transporter.sendMail({
        from: "Gangsar <gangsar45@gmail.com>",
        to: "gangsararyo@gmail.com",
        subject: "Verify Email to Change Email",
        html: htmlToEmail,
      });

      return res.status(200).send(cekPass);
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: error.message });
    }
  },

  verifyChangeEmail: async (req, res) => {
    const connDb = connection.promise();
    try {
      console.log(req.user);
      let sql = `update user set ? where id = ?`;
      await connDb.query(sql, [
        { email: req.user.email, is_verified: 1 },
        req.user.id,
      ]);

      console.log("berhasil");
      return res.status(200).send({ message: "Berhasil ganti email" });
    } catch (error) {
      return res.status(500).send({ message: error.message });
    }
  },
};
