const { connection } = require("../connection");

module.exports = {
    getRevenue: async (req, res) => {
        console.log("Jalan /sales/revenue");
        const conn = await connection.promise().getConnection();

        try {
            let sql = `SET sql_mode=(SELECT REPLACE(@@sql_mode,'ONLY_FULL_GROUP_BY',''));`
            await conn.query(sql);

            sql = `
                SELECT 
                SUM(IF(month = 'Jan', revenue, 0)) AS 'January',
                SUM(IF(month = 'Feb', revenue, 0)) AS 'February',
                SUM(IF(month = 'Mar', revenue, 0)) AS 'March',
                SUM(IF(month = 'Apr', revenue, 0)) AS 'April',
                SUM(IF(month = 'May', revenue, 0)) AS 'May',
                SUM(IF(month = 'Jun', revenue, 0)) AS 'June',
                SUM(IF(month = 'Jul', revenue, 0)) AS 'July',
                SUM(IF(month = 'Aug', revenue, 0)) AS 'August',
                SUM(IF(month = 'Sep', revenue, 0)) AS 'September',
                SUM(IF(month = 'Oct', revenue, 0)) AS 'October',
                SUM(IF(month = 'Nov', revenue, 0)) AS 'November',
                SUM(IF(month = 'Dec', revenue, 0)) AS 'December',
                SUM(revenue) AS total_yearly
                    FROM (SELECT DATE_FORMAT(o.create_on, "%b") AS month, SUM(od.price) AS revenue
                        FROM order_detail AS od
                        JOIN orders o
                        ON od.orders_id = o.id
                        WHERE o.create_on <= NOW() AND o.create_on >= DATE_ADD(NOW(), interval - 12 MONTH) AND status_id = ? AND YEAR(o.create_on) = ?
                        GROUP BY DATE_FORMAT(o.create_on, "%m-%Y")) AS sub;
            `
            const [revenueResult] = await conn.query(sql, [2, 2021])
            console.log(revenueResult)

            conn.release();
            return res.status(200).send(revenueResult[0]);
        } catch (error) {
            conn.release();
            console.log(error);
            return res.status(500).send({ message: error.message || "Server error" });
        }
    }
}