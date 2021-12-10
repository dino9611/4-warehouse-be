const { connection } = require("./../connection");
const fs = require("fs");

module.exports = {
  uploadProfilePicture: async (req, res) => {
    const connDb = connection.promise();

    try {
      const path = "/photo-profile";

      let imagePath = req.files.image
        ? `${path}/${req.files.image[0].filename}`
        : null;

      let sql = `update user set profile_picture = ? where id = ? and role_id = 3`;
      await connDb.query(sql, [imagePath, req.params.userId]);

      return res.status(200).send({ message: "Foto telah dirubah" });
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: error.message });
    }
  },

  getPersonalData: async (req, res) => {
    const connDb = connection.promise();

    try {
      let sql = `select first_name, last_name, email, gender, date_of_birth from user where id = ?`;
      let [personalData] = await connDb.query(sql, [req.params.userId]);

      return res.status(200).send(personalData);
    } catch (error) {
      console.log(error);
      res.status(500).send({ message: error.message });
    }
  },

  inputPersonalData: async (req, res) => {
    const connDb = connection.promise();

    try {
      let sql = `update user set ? where id = ? and role_id = 3`;
      await connDb.query(sql, [req.body, req.params.userId]);

      return res.status(200).send({ message: "Data berhasil disimpan" });
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: error.message });
    }
  },
};
