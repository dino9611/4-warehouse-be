const { connection } = require("../connection");
const RajaOngkir = require("rajaongkir-nodejs").Starter(
  "8b87be47bf10fc3f713790a8957c0ab6"
);
const geolib = require("geolib");

module.exports = {
  getMainAddress: async (req, res) => {
    const connDb = connection.promise();

    try {
      let sql = `select a.id, recipient, phone_number ,address, latitude, longitude, province, province_id, city, city_id from address a
      join region r
      on r.address_id = a.id
      where user_id = ? and is_main_address = 1`;
      let [mainAddress] = await connDb.query(sql, [req.params.userId]);

      return res.status(200).send(mainAddress);
    } catch (error) {
      return res.status(500).send({ message: error.message });
    }
  },

  getAddressuser: async (req, res) => {
    const connDb = connection.promise();

    try {
      let sql = `select a.id, recipient, phone_number ,address, latitude, longitude, province, province_id, city, city_id, is_main_address from address a
      join region r
      on r.address_id = a.id
      where user_id = ?
      order by is_main_address desc`;
      let [dataAddress] = await connDb.query(sql, req.params.userId);

      return res.status(200).send(dataAddress);
    } catch (error) {
      return res.status(500).send({ message: error.message });
    }
  },

  changeMainAddress: async (req, res) => {
    const connDb = await connection.promise().getConnection();

    try {
      await connDb.beginTransaction();

      let sql = `select id from address where user_id = ? and is_main_address = 1`;
      let [dataMainAddress] = await connDb.query(sql, [req.body.user_id]);

      sql = `update address set ? where id = ?`;
      await connDb.query(sql, [{ is_main_address: 0 }, dataMainAddress[0].id]);

      sql = `update address set ? where id = ?`;
      let [newMain] = await connDb.query(sql, [
        { is_main_address: 1 },
        req.body.id,
      ]);

      sql = `select a.id, recipient, phone_number ,address, latitude, longitude, province, province_id, city, city_id, is_main_address from address a
      join region r
      on r.address_id = a.id
      where user_id = ?
      order by is_main_address desc`;
      let [dataAddress] = await connDb.query(sql, req.body.user_id);

      connDb.release();

      await connDb.commit();

      return res.status(200).send(dataAddress);
    } catch (error) {
      await connDb.rollback();
      connDb.release();
      return res.status(500).send({ message: error.message });
    }
  },

  addAddress: async (req, res) => {
    const connDb = connection.promise();

    try {
      let sql = `insert into address `;
    } catch (error) {
      return res.status(500).send({ message: error.message });
    }
  },

  shippingFee: async (req, res) => {
    const connDb = connection.promise();

    try {
      let sql = `select a.id, user_id, address, city_id, latitude, longitude from address a
      join region r
      on r.address_id = a.id
      where a.id = ?`;
      let [userAddress] = await connDb.query(sql, [req.params.addressId]);

      sql = `select id, name, address, province, province_id, city, city_id, latitude, longitude from warehouse`;
      let [warehouseAddress] = await connDb.query(sql);

      let findNearest = geolib.findNearest(userAddress[0], warehouseAddress);

      var params = {
        origin: findNearest.city_id, // ID Kota atau Kabupaten Asal
        destination: userAddress[0].city_id, // ID Kota atau Kabupaten Tujuan
        weight: 250, // Berat Barang dalam gram (gr)
      };

      let res1 = await RajaOngkir.getJNECost(params);

      return res
        .status(200)
        .send({ ...res1.rajaongkir.results, ...findNearest });
    } catch (error) {
      return res.status(500).send({ message: error.message });
    }
  },
};
