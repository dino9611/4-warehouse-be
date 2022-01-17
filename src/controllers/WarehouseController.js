const { connection } = require("../connection");
const rajaOngkirForAdmin = require("rajaongkir-nodejs").Starter("de17bd7bb0affc59cadc64b73ebffe2f");

module.exports = {
    getWarehouse: async (req, res) => {
        console.log("Jalan /warehouse/list");
        const conn = await connection.promise().getConnection();

        try {
            let sql = `SELECT id, name, address, province, city, latitude, longitude FROM warehouse;`;

            const [warehouseResult] = await conn.query(sql);

            conn.release();
            return res.status(200).send(warehouseResult);
        } catch (error) {
            conn.release();
            console.log(error);
            return res.status(500).send({ message: error.message || "Server error" });
        };
    },
    addWarehouse: async (req, res) => {
        console.log("Jalan /warehouse/add");
        const conn = await connection.promise().getConnection();

        // Destructure data input produk dari FE, utk insert ke MySql
        const {
          warehouse_name,
          warehouse_address,
          province_id,
          province,
          city_id,
          city,
          warehouse_latitude,
          warehouse_longitude
        } = req.body;

        try {
          await conn.beginTransaction(); // Aktivasi table tidak permanen agar bisa rollback/commit permanent

          let sql = `INSERT INTO warehouse SET ?`;
          let addDataWh = {
            name: warehouse_name,
            address: warehouse_address,
            province_id,
            province,
            city_id,
            city,
            latitude: warehouse_latitude,
            longitude: warehouse_longitude
          };
          const [addResult] = await conn.query(sql, addDataWh);

          await conn.commit(); // Commit permanent data diupload ke MySql klo berhasil
          conn.release();
          return res.status(200).send({ message: "Berhasil tambah warehouse" });
        } catch (error) {
          await conn.rollback(); // Rollback data klo terjadi error/gagal
          conn.release();
          console.log(error);
          return res.status(500).send({ message: error.message || "Server error" });
        };
    },
    getProvinceAdmin: async (req, res) => {
      console.log("Jalan /warehouse/province");
  
      try {
        let provinces = await rajaOngkirForAdmin.getProvinces();

        let dataProvince = provinces.rajaongkir.results;

        let provinceOptions = dataProvince.map((val, index) => {
          return { value: val.province, label: val.province, ...val };
        });

        return res.status(200).send(provinceOptions);
      } catch (error) {
        console.log(error);
        return res.status(500).send({ message: error.message });
      }
    },
    getCityAdmin: async (req, res) => {
      console.log("Jalan /warehouse/city/:province");
  
      try {
        let cities = await rajaOngkirForAdmin.getCities();

        if (cities.rajaongkir.status.code != 200) {
          throw { message: cities.rajaongkir.status.description };
        }
  
        let filterCities = cities.rajaongkir.results.filter((el) =>
          el.province.toLowerCase().includes(req.params.province.toLowerCase())
        );
  
        let cityOptions = filterCities.map((val, index) => {
          return { value: `${val.type} ${val.city_name}`, label: `${val.type} ${val.city_name}`, ...val };
        });
  
        return res.status(200).send(cityOptions);
      } catch (error) {
        console.log(error);
        return res.status(500).send({ message: error.message });
      }
    }
}