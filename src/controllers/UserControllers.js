const { connection } = require("../connection");

module.exports = {
  chooseDefaultAddress: async (req, res) => {
    const conn = await connection.promise().getConnection();
    let { user_id } = req.body;
    let { idAddress } = req.params;
    try {
      let sql = `select id from address where user_id = ? and is_main_address = 1`;
      let [mainAddressId] = await conn.query(sql, [user_id]);
      let updateAddress = {
        is_main_address: 0,
      };
      sql = `update address set ? where id = ? `;
      await conn.query(sql, [updateAddress, mainAddressId[0].id]);

      let updateDefaultAddress = {
        is_main_address: 1,
      };
      sql = `update address set ? where id = ?`;
      await conn.query(sql, [updateDefaultAddress, idAddress]);
      conn.release();
      return res
        .status(200)
        .send({ message: "Berhasil mengganti alamat utama" });
    } catch (error) {
      conn.release();
      console.log(error);
      return res.status(500).send({ message: error.message });
    }
  },
  getAddress: async (req, res) => {
    const conn = await connection.promise().getConnection();

    try {
      let sql = `select id, address, latitude, longitude from address where user_id = ?`;
      let [dataAddress] = await conn.query(sql, [req.params.userId]);
      conn.release();
      return res.status(200).send(dataAddress);
    } catch (error) {
      conn.release();
      console.log(error);
      return res.status(500).send({ message: error.message });
    }
  },
  inputAddress: async (req, res) => {
    const conn = await connection.promise().getConnection();
    let { user_id, address, longitude, latitude } = req.body;
    try {
      let sql = `select id from address where user_id = ?`;
      let [idAddress] = await conn.query(sql, [user_id]);
      // let idAddress = await conn.query(sql, [user_id])
      // idAddress = idAddress[0]
      let is_main_address = 1;
      if (idAddress.length) {
        is_main_address = 0;
      }
      let dataInsert = {
        user_id,
        address: address,
        longitude,
        latitude,
        is_main_address,
      };
      sql = `INSERT into address set ?`;
      await conn.query(sql, [dataInsert]);
      conn.release();
      return res.status(200).send({ message: "Berhasil menambah alamat" });
    } catch (error) {
      conn.release();
      console.log(error);
      return res.status(500).send({ message: error.message });
    }
  },
};
