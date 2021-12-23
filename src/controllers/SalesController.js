const { connection } = require("../connection");

module.exports = {
    getMonthlyRevenue: async (req, res) => {
        console.log("Jalan /sales/monthly-revenue");
        const conn = await connection.promise().getConnection();
        const {filter_year} = req.headers;

        try {
            let sql = `
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
            let sql = `
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
    getYearlyRevenue: async (req, res) => {
        console.log("Jalan /sales/yearly-revenue");
        const conn = await connection.promise().getConnection();
        const {filter_year} = req.headers;

        try {
            let sql = `
                SELECT SUM(revenue) AS total_yearly
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
    getTopProdQty: async (req, res) => {
        console.log("Jalan /sales/top-prod-qty");
        const conn = await connection.promise().getConnection();
        const {filter_year} = req.headers;

        try {
            let sql = `
                SELECT od.product_id, p.name, SUM(od.qty) AS qty_sold FROM order_detail AS od
                JOIN orders o
                ON od.orders_id = o.id
                JOIN product p
                ON od.product_id = p.id
                WHERE o.status_id = ? AND YEAR(o.create_on) = ?
                GROUP BY od.product_id
                ORDER BY qty_sold DESC
                LIMIT 5;
            `
            const [topProdResult] = await conn.query(sql, [2, parseInt(filter_year)]);

            conn.release();
            return res.status(200).send(topProdResult);
        } catch (error) {
            conn.release();
            console.log(error);
            return res.status(500).send({ message: error.message || "Server error" });
        }
    },
    getTopProdVal: async (req, res) => {
        console.log("Jalan /sales/top-prod-qty");
        const conn = await connection.promise().getConnection();
        const {filter_year} = req.headers;

        try {
            let sql = `
                SELECT od.product_id, p.name, SUM(od.price) AS sales_value FROM order_detail AS od
                JOIN orders o
                ON od.orders_id = o.id
                JOIN product p
                ON od.product_id = p.id
                WHERE o.status_id = ? AND YEAR(o.create_on) = ?
                GROUP BY od.product_id
                ORDER BY sales_value DESC
                LIMIT 5;
            `
            const [topProdResult] = await conn.query(sql, [2, parseInt(filter_year)]);

            conn.release();
            return res.status(200).send(topProdResult);
        } catch (error) {
            conn.release();
            console.log(error);
            return res.status(500).send({ message: error.message || "Server error" });
        }
    },
    getTotalProdSold: async (req, res) => {
        console.log("Jalan /sales/prod-sold");
        const conn = await connection.promise().getConnection();
        const {filter_year} = req.headers;

        try {
            let sql = `
                SELECT SUM(qty) AS total_qty_sold FROM order_detail AS od
                JOIN orders o
                ON od.orders_id = o.id
                WHERE status_id = ? AND YEAR(o.create_on) = ?;
            `
            const [usersResult] = await conn.query(sql, [2, parseInt(filter_year)]);

            conn.release();
            return res.status(200).send(usersResult[0]);
        } catch (error) {
            conn.release();
            console.log(error);
            return res.status(500).send({ message: error.message || "Server error" });
        }
    },
    getTopUsers: async (req, res) => {
        console.log("Jalan /sales/top-users");
        const conn = await connection.promise().getConnection();
        const {filter_year} = req.headers;

        try {
            let sql = `
                SELECT u.id AS user_id, u.username, SUM(od.price) AS total_transaction_value FROM user AS u
                JOIN orders o
                ON u.id = o.user_id
                JOIN order_detail od
                ON o.id = od.orders_id
                WHERE o.status_id = ? AND YEAR(o.create_on) = ?
                GROUP BY u.id
                ORDER BY total_transaction_value DESC
                LIMIT 5;
            `
            const [topProdResult] = await conn.query(sql, [2, parseInt(filter_year)]);

            conn.release();
            return res.status(200).send(topProdResult);
        } catch (error) {
            conn.release();
            console.log(error);
            return res.status(500).send({ message: error.message || "Server error" });
        }
    },
    getTotalUsers: async (req, res) => {
        console.log("Jalan /sales/total-users");
        const conn = await connection.promise().getConnection();

        try {
            let sql = `
                SELECT COUNT(id) AS total_users FROM user
                WHERE role_id = ?;
            `
            const [usersResult] = await conn.query(sql, 3);

            conn.release();
            return res.status(200).send(usersResult[0]);
        } catch (error) {
            conn.release();
            console.log(error);
            return res.status(500).send({ message: error.message || "Server error" });
        }
    },
    getCategoryContribution: async (req, res) => {
        console.log("Jalan /sales/category-contribution");
        const conn = await connection.promise().getConnection();
        const {filter_year} = req.headers;

        try {
            let sql = `
                SELECT 
                c.category, 
                SUM(od.price) AS amount, 
                ROUND(SUM(od.price) * 100 / (SELECT SUM(price) AS tc FROM order_detail 
                    JOIN orders o 
                    ON order_detail.orders_id = o.id 
                    WHERE o.status_id = ? AND YEAR(o.create_on) = ?), 1) AS contribution 
                    FROM category AS c
                        JOIN product p
                        ON c.id = p.category_id
                        JOIN order_detail od
                        ON p.id = od.product_id
                        JOIN orders o
                        ON od.orders_id = o.id 
                        WHERE o.status_id = ? AND YEAR(o.create_on) = ? 
                        GROUP BY c.category
                        ORDER BY amount DESC;
            `
            const [categoryResult] = await conn.query(sql, [2, parseInt(filter_year), 2, parseInt(filter_year)]);

            conn.release();
            return res.status(200).send(categoryResult);
        } catch (error) {
            conn.release();
            console.log(error);
            return res.status(500).send({ message: error.message || "Server error" });
        }
    },
}

// 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION'