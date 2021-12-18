const { connection } = require("../connection");

module.exports = {
    getWarehouse: async (req, res) => {
        console.log("Jalan /warehouse/list");
        const conn = await connection.promise().getConnection();

        try {
            let sql = `SELECT id, name, address, latitude, longitude FROM warehouse;`;

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
          warehouse_address
        } = req.body;

        try {
          await conn.beginTransaction(); // Aktivasi table tidak permanen agar bisa rollback/commit permanent

          let sql = `INSERT INTO warehouse SET ?`;
          let addDataWh = {
            name: warehouse_name,
            address: warehouse_address
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
    }
}