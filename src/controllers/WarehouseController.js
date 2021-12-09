const { connection } = require("../connection");

module.exports = {
    getWarehouse: async (req, res) => {
        console.log("Jalan /warehouse/list");
        const conn = await connection.promise().getConnection();

        try {
            let sql = `SELECT id, name FROM warehouse;`

            const [warehouseResult] = await conn.query(sql);

            conn.release();
            return res.status(200).send(warehouseResult);
        } catch (error) {
            conn.release();
            console.log(error);
            return res.status(500).send({ message: error.message || "Server error" });
        };
    },
}