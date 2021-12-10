const { connection } = "./../connection";
const fs = require("fs");

module.exports = {
  uploadProfilePicture: async (req, res) => {
    const connDb = connection.promise();

    try {
      const path = "/photo-profile";

      let sql = `select * from user where id = 1`;
      let [tes] = await connDb.query(sql);

      console.log(tes);

      // let imagePath = req.files.image
      //   ? `${path}/${req.files.image[0].filename}`
      //   : null;

      // let sql = `update user set profile_picture = ? where id = ? and role_id = 3`;
      // await connDb.query(sql, [imagePath, req.params.userId]);

      return res.status(200).send({ message: "Foto telah dirubah" });
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: error.message });
    }
  },

  categories: async (req, res) => {
    const connDb = connection.promise();

    try {
      let sql = `select * from category`;
      let [data] = await connDb.query(sql);

      return res.send(data);
    } catch (error) {
      return res.status(500).send({ message: error.message });
    }
  },
};
