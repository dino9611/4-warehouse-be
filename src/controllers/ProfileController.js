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
};
