const { connection } = require("../connection");

module.exports = {
    getProdCategory: async (req, res) => {
        console.log("Jalan /product/category");
        const conn = await connection.promise().getConnection();

        try {
            let sql = `SELECT id, category FROM category;`

            const [categoryResult] = await conn.query(sql);

            conn.release();
            return res.status(200).send(categoryResult);
        } catch (error) {
            conn.release();
            console.log(error);
            return res.status(500).send({ message: error.message || "Server error" });
        };
    },
}