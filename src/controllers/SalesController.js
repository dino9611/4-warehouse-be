const { connection } = require("../connection");

module.exports = {
    getRevenue: async (req, res) => {
        console.log("Jalan /sales/revenue");
        const conn = await connection.promise().getConnection();

        try {
            
            conn.release();

        } catch (error) {
            conn.release();
            console.log(error);
            return res.status(500).send({ message: error.message || "Server error" });
        }
    }
}