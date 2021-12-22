const { connection } = require("../connection");

module.exports = {
    getMonthlyRevenue: async (req, res) => {
        console.log("Jalan /sales/monthly-revenue");
        const conn = await connection.promise().getConnection();
        const {filter_year} = req.headers;

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
                SUM(IF(month = 'Dec', revenue, 0)) AS 'December'
                    FROM (SELECT DATE_FORMAT(o.create_on, "%b") AS month, SUM(od.price) AS revenue
                        FROM order_detail AS od
                        JOIN orders o
                        ON od.orders_id = o.id
                        WHERE o.create_on <= NOW() AND o.create_on >= DATE_ADD(NOW(), interval - 12 MONTH) AND status_id = ? AND YEAR(o.create_on) = ?
                        GROUP BY DATE_FORMAT(o.create_on, "%m-%Y")) AS sub;
            `
            const [revenueResult] = await conn.query(sql, [2, parseInt(filter_year)]);

            conn.release();
            return res.status(200).send(revenueResult[0]);
        } catch (error) {
            conn.release();
            console.log(error);
            return res.status(500).send({ message: error.message || "Server error" });
        }
    },
    getPotentialRevenue: async (req, res) => {
        console.log("Jalan /sales/potential-revenue");
        const conn = await connection.promise().getConnection();
        const {filter_year} = req.headers;

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
                SUM(IF(month = 'Dec', revenue, 0)) AS 'December'
                    FROM (SELECT DATE_FORMAT(o.create_on, "%b") AS month, SUM(od.price) AS revenue
                        FROM order_detail AS od
                        JOIN orders o
                        ON od.orders_id = o.id
                        WHERE o.create_on <= NOW() AND o.create_on >= DATE_ADD(NOW(), interval - 12 MONTH) AND status_id = ? OR status_id = ? AND YEAR(o.create_on) = ?
                        GROUP BY DATE_FORMAT(o.create_on, "%m-%Y")) AS sub;
            `
            const [revenueResult] = await conn.query(sql, [1, 2, parseInt(filter_year)]);

            conn.release();
            return res.status(200).send(revenueResult[0]);
        } catch (error) {
            conn.release();
            console.log(error);
            return res.status(500).send({ message: error.message || "Server error" });
        }
    },
    getStatusContribution: async (req, res) => {
        console.log("Jalan /sales/status-contribution");
        const conn = await connection.promise().getConnection();
        const {filter_year} = req.headers;

        try {
            let sql = `
                SELECT 
                so.status, 
                SUM(od.price) AS amount, 
                ROUND(SUM(od.price) * 100 / (SELECT SUM(price) AS c FROM order_detail), 1) AS contribution 
                FROM order_detail AS od 
                    JOIN orders o 
                    ON od.orders_id = o.id 
                    JOIN status_order so 
                    ON o.status_id = so.id 
                    WHERE YEAR(o.create_on) = 2021 
                    GROUP BY status 
                    ORDER BY so.id ASC;
            `
            const [statusResult] = await conn.query(sql, [1, 2, parseInt(filter_year)]);

            conn.release();
            return res.status(200).send(statusResult);
        } catch (error) {
            conn.release();
            console.log(error);
            return res.status(500).send({ message: error.message || "Server error" });
        }
    },
}