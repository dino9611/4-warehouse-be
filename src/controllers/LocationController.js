const express = require("express");
const app = express();
const { connection } = require("../connection");
require("dotenv").config();
const RajaOngkir = require("rajaongkir-nodejs").Starter(
  `${process.env.RAJA_LOCATION_GANGSAR}`
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

      sql = `update address set is_main_address = 0 where id = ?`;
      await connDb.query(sql, [dataMainAddress[0].id]);

      sql = `update address set is_main_address = 1 where id = ?`;
      await connDb.query(sql, [req.body.id]);

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

  shippingFee: async (req, res) => {
    const connDb = connection.promise();

    try {
      let sql = `select a.id, user_id, address, city_id, latitude, longitude from address a
      join region r
      on r.address_id = a.id
      where a.id = ?`;
      let [userAddress] = await connDb.query(sql, [req.params.addressId]);

      sql = `select sum(weight) as total_weight from cart_detail cd
      join product p
      on p.id = cd.product_id
      where cd.cart_id = ? and cd.is_deleted = 0`;
      let [totalBerat] = await connDb.query(sql, [req.query.cartId]);

      sql = `select id, name, address, province, province_id, city, city_id, latitude, longitude from warehouse`;
      let [warehouseAddress] = await connDb.query(sql);

      let findNearest = geolib.findNearest(userAddress[0], warehouseAddress);

      var params = {
        origin: findNearest.city_id, // ID Kota atau Kabupaten Asal
        destination: userAddress[0].city_id, // ID Kota atau Kabupaten Tujuan
        weight: totalBerat[0].total_weight, // Berat Barang dalam gram (gr)
      };

      let res1 = await RajaOngkir.getJNECost(params);

      return res
        .status(200)
        .send({ ...res1.rajaongkir.results[0], ...findNearest });
    } catch (error) {
      if (error.rajaongkir.status.code === 400)
        return res.status(400).send({ message: "Kuota habis" });
      return res.status(500).send({ message: error.message });
    }
  },

  getProvince: async (req, res) => {
    try {
      let provinces = await RajaOngkir.getProvinces();

      let provincesSelect = provinces.rajaongkir.results.map((el) => {
        return { ...el, label: el.province, value: el.province };
      });

      return res.status(200).send(provincesSelect);
    } catch (error) {
      if (error.rajaongkir.status.code === 400)
        return res.status(400).send({ message: "Kuota habis" });
      return res.status(500).send({ message: error.message });
    }
  },

  getcity: async (req, res) => {
    try {
      let cities = await RajaOngkir.getCities();

      let filterCities = cities.rajaongkir.results.filter((el) =>
        el.province.toLowerCase().includes(req.params.province.toLowerCase())
      );

      let cityOptions = filterCities.map((el, index) => {
        return {
          value: el.city_name,
          label: `${el.type} ${el.city_name}`,
          ...el,
        };
      });

      return res.status(200).send(cityOptions);
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: error.message });
    }
  },

  addNewAddress: async (req, res) => {
    const connDb = await connection.promise().getConnection();
    const {
      user_id,
      recipient,
      phone_number,
      address,
      latitude,
      longitude,
      is_main_address,
      province,
      city_id,
      province_id,
      label,
    } = req.body;

    try {
      await connDb.beginTransaction();

      let sql = `select id from address where user_id = ?`;
      let [isAddressTrue] = await connDb.query(sql, user_id);

      let dataAddress;

      if (!isAddressTrue.length) {
        dataAddress = {
          user_id,
          recipient,
          phone_number,
          address,
          latitude,
          longitude,
          is_main_address: 1,
        };
      } else {
        if (parseInt(is_main_address) === 1) {
          let sql = `select id from address where user_id = ? and is_main_address = 1`;
          let [dataMainAddress] = await connDb.query(sql, [user_id]);

          sql = `update address set is_main_address = 0 where id = ?`;
          await connDb.query(sql, [dataMainAddress[0].id]);

          dataAddress = {
            user_id,
            recipient,
            phone_number,
            address,
            latitude,
            longitude,
            is_main_address,
          };
        } else {
          dataAddress = {
            user_id,
            recipient,
            phone_number,
            address,
            latitude,
            longitude,
            is_main_address: 0,
          };
        }
      }

      sql = `insert into address set ?`;
      let [newAddress] = await connDb.query(sql, dataAddress);

      const dataRegion = {
        address_id: newAddress.insertId,
        province,
        province_id,
        city: label,
        city_id,
      };

      sql = `insert into region set ?`;
      await connDb.query(sql, dataRegion);

      await connDb.commit();

      connDb.release();

      return res
        .status(200)
        .send({ message: "Berhasil menyimpan alamat baru" });
    } catch (error) {
      await connDb.rollback();
      connDb.release();

      return res.status(500).send({ message: error.message });
    }
  },

  getDistance: async (req, res) => {
    const connDb = await connection.promise().getConnection();

    try {
      let sql = `select a.id, user_id, address, city_id, latitude, longitude from address a
      join region r
      on r.address_id = a.id
      where a.id = ?`;
      let [userAddress] = await connDb.query(sql, [req.params.addressId]);

      sql = `select id, name, address, province, province_id, city, city_id, latitude, longitude from warehouse`;
      let [warehouseAddress] = await connDb.query(sql);

      let findNearest = geolib.findNearest(userAddress[0], warehouseAddress);

      const getDistance = geolib.getDistance(userAddress[0], findNearest);

      connDb.release();

      const dataShipment = {
        ...findNearest,
        code: "Local Shipment",
        costs: [
          {
            service: "SPS",
            description: "Sabar Pasti Sampai",
            cost: [{ value: Math.round(0.1 * getDistance), etd: "1-2" }],
          },
        ],
      };

      return res.status(200).send(dataShipment);
    } catch (error) {
      connDb.release();

      return res.status(500).send({ message: error.message });
    }
  },
};
