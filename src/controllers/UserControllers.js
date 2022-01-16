const { connection } = require("../connection");
const rajaOngkir = require("rajaongkir-nodejs").Starter(
  "9387bc437b911646faccf03eacfd0b66"
);

module.exports = {
  chooseDefaultAddress: async (req, res) => {
    const conn = await connection.promise().getConnection();
    let { user_id } = req.body;
    let { idAddress } = req.params;
    try {
      //select id dari address
      let sql = `select id from address where user_id = ? and is_main_address = 1`;
      let [mainAddressId] = await conn.query(sql, [user_id]);
      //data untuk update
      let updateAddress = {
        is_main_address: 0,
      };
      //update is_main_address = 0
      sql = `update address set ? where id = ? `;
      await conn.query(sql, [updateAddress, mainAddressId[0].id]);
      conn.release();

      let updateDefaultAddress = {
        is_main_address: 1,
      };
      //update address jadi main address/ is_main_address=1
      sql = `update address set ? where id = ?`;
      await conn.query(sql, [updateDefaultAddress, idAddress]);
      console.log("berhasil");
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
      // get data yang ada di address
      let sql = `select a.id, recipient, phone_number ,address, latitude, longitude, province, province_id, city, city_id, is_main_address, is_delete from address a
      join region r
      on r.address_id = a.id
      where user_id = ? and is_delete = 0
      order by is_main_address desc`;
      let [dataAddress] = await conn.query(sql, [req.params.userId]);
      // if (dataAddress[0].is_delete === 1) {
      // }
      // console.log(dataAddress);
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
    let {
      address,
      longitude,
      latitude,
      province_id,
      city_id,
      recipient,
      phone_number,
      city,
      province,
    } = req.body;
    let { userId } = req.params;
    try {
      //dapetin id address dari address
      let sql = `select id from address where user_id = ? and is_delete = 0`;
      let [idAddress] = await conn.query(sql, [userId]);
      // let idAddress = await conn.query(sql, [user_id])
      // idAddress = idAddress[0] //? line 57 = 58 & 59
      let is_main_address = 1;
      if (idAddress.length) {
        is_main_address = 0;
      }
      console.log(is_main_address);
      console.log(idAddress);
      conn.release();
      //data untuk insert
      let dataInsert = {
        user_id: userId,
        address: address, // line 65/66 sama, ketentuan line 66 property & hasilnya sama
        longitude,
        latitude,
        is_main_address,
        recipient,
        phone_number,
      };
      //masukkin data yang udh di input ke database
      sql = `INSERT into address set ?`;
      let [insertRegion] = await conn.query(sql, [dataInsert]);

      //insert data ke region
      let dataRegion = {
        province,
        province_id,
        city_id,
        city,
        address_id: insertRegion.insertId,
      };
      sql = `INSERT into region set ?`;
      await conn.query(sql, [dataRegion]);
      console.log("berhasil");
      conn.release();
      return res.status(200).send({ message: "Berhasil menambah alamat" });
    } catch (error) {
      conn.release();
      console.log(error);
      return res.status(500).send({ message: error.message });
    }
  },
  deleteAddress: async (req, res) => {
    const conn = await connection.promise().getConnection();
    const addressId = req.params.addressId;
    console.log(req.params.addressId);
    try {
      let sql = `UPDATE address SET is_delete = 1 WHERE id = ?;`;
      await conn.query(sql, [addressId]);
      conn.release();
      return res.status(200).send({ message: "Berhasil menghapus alamat" });
    } catch (error) {
      conn.release();
      console.log(error);
      return res.status(500).send({ message: error.message });
    }
  },
  editAddress: async (req, res) => {
    const conn = await connection.promise().getConnection();
    let {
      address,
      longitude,
      latitude,
      recipient,
      phone_number,
      province_id,
      city_id,
      city,
      province,
    } = req.body;
    // let { userId } = req.params
    try {
      let sql = ` select id from address where id =? `;
      await conn.query(sql, [req.params.addressId]);
      conn.release();

      let dataUpdate = {
        address: address,
        longitude,
        latitude,
        recipient,
        phone_number,
      };
      sql = `update address set ? where id = ?`;
      await conn.query(sql, [dataUpdate, req.params.addressId]);

      let dataRegion = {
        province,
        province_id,
        city_id,
        city,
      };
      sql = `update region set ? where address_id = ?`;
      await conn.query(sql, [dataRegion, req.params.addressId]);
      conn.release();
      return res.status(200).send({ message: "Berhasil menyimpan alamat" });
    } catch (error) {
      conn.release();
      console.log(error);
      return res.status(500).send({ message: error.message });
    }
  },
  getProvince: async (req, res) => {
    try {
      let provinces = await rajaOngkir.getProvinces();
      let dataProvince = provinces.rajaongkir.results;
      let provinceOptions = dataProvince.map((val, index) => {
        return { value: val.province, label: val.province, ...val };
      });
      console.log("test");
      // let option1 = options?.map((val, index) => {
      //   return { warna: val.label, rasa: val.value, ...val };
      // });

      // if (provinces.rajaongkir.status.code != 200) {
      //   throw { message: provinces.rajaongkir.status.description };
      // }
      // return res.status(200).send(provinces.rajaongkir.results);
      return res.status(200).send(provinceOptions);
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: error.message });
    }
  },

  getcity: async (req, res) => {
    try {
      let cities = await rajaOngkir.getCities();
      console.log(cities);
      if (cities.rajaongkir.status.code != 200) {
        throw { message: cities.rajaongkir.status.description };
      }

      let filterCities = cities.rajaongkir.results.filter((el) =>
        el.province.toLowerCase().includes(req.params.province.toLowerCase())
      );

      let cityOptions = filterCities.map((val, index) => {
        return { value: val.city_name, label: val.city_name, ...val };
      });

      return res.status(200).send(cityOptions);
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: error.message });
    }
  },
};