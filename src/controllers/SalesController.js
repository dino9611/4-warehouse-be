const { connection } = require("../connection");

module.exports = {
    getMonthlyRevenue: async (req, res) => {
        console.log("Jalan /sales/monthly-revenue");
        const conn = await connection.promise().getConnection();
        const {filter_year, role_id, warehouse_id} = req.headers;

        try {
            let sql;
            let queryParameter;

            if (parseInt(role_id) === 1) {
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
                `;
                queryParameter = [5, parseInt(filter_year)];
            } else {
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
                            WHERE o.create_on <= NOW() AND o.create_on >= DATE_ADD(NOW(), interval - 12 MONTH) AND status_id = ? AND YEAR(o.create_on) = ? AND warehouse_id = ?
                            GROUP BY DATE_FORMAT(o.create_on, "%m-%Y")) AS sub;
                `;
                queryParameter = [5, parseInt(filter_year), parseInt(warehouse_id)];
            };

            const [revenueResult] = await conn.query(sql, queryParameter);

            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            for (let i = 0; i < monthNames.length; i++) {
                revenueResult[0][monthNames[i]] = parseInt(revenueResult[0][monthNames[i]]);
            }; //* Merubah hasil masing2 bulan menjadi data type numbers

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
        const {filter_year, role_id, warehouse_id} = req.headers;

        try {
            let sql;
            let queryParameter;

            if (parseInt(role_id) === 1) {
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
                            WHERE o.create_on <= NOW() AND o.create_on >= DATE_ADD(NOW(), interval - 12 MONTH) AND YEAR(o.create_on) = ?
                            GROUP BY DATE_FORMAT(o.create_on, "%m-%Y")) AS sub;
                `;
                queryParameter = [parseInt(filter_year)];
            } else {
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
                            WHERE o.create_on <= NOW() AND o.create_on >= DATE_ADD(NOW(), interval - 12 MONTH) AND YEAR(o.create_on) = ? AND warehouse_id = ?
                            GROUP BY DATE_FORMAT(o.create_on, "%m-%Y")) AS sub;
                `;
                queryParameter = [parseInt(filter_year), parseInt(warehouse_id)];
            };

            const [revenueResult] = await conn.query(sql, queryParameter);

            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            for (let i = 0; i < monthNames.length; i++) {
                revenueResult[0][monthNames[i]] = parseInt(revenueResult[0][monthNames[i]]);
            }; //* Merubah hasil masing2 bulan menjadi data type numbers

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
        const {filter_year, role_id, warehouse_id} = req.headers;

        try {
            let sql;
            let queryParameter;

            if (parseInt(role_id) === 1) {
                sql = `
                    SELECT IFNULL(SUM(revenue), 0) AS total_yearly
                    FROM (SELECT DATE_FORMAT(o.create_on, "%b") AS month, SUM(od.price) AS revenue
                        FROM order_detail AS od
                        JOIN orders o
                        ON od.orders_id = o.id
                        WHERE o.create_on <= NOW() AND o.create_on >= DATE_ADD(NOW(), interval - 12 MONTH) AND status_id = ? AND YEAR(o.create_on) = ?
                        GROUP BY DATE_FORMAT(o.create_on, "%m-%Y")) AS sub;
                `;
                queryParameter = [5, parseInt(filter_year)];
            } else {
                sql = `
                    SELECT IFNULL(SUM(revenue), 0) AS total_yearly
                    FROM (SELECT DATE_FORMAT(o.create_on, "%b") AS month, SUM(od.price) AS revenue
                        FROM order_detail AS od
                        JOIN orders o
                        ON od.orders_id = o.id
                        WHERE o.create_on <= NOW() AND o.create_on >= DATE_ADD(NOW(), interval - 12 MONTH) AND status_id = ? AND YEAR(o.create_on) = ? AND warehouse_id = ?
                        GROUP BY DATE_FORMAT(o.create_on, "%m-%Y")) AS sub;
                `;
                queryParameter = [5, parseInt(filter_year), parseInt(warehouse_id)];
            };

            const [revenueResult] = await conn.query(sql, queryParameter);

            conn.release();
            return res.status(200).send(revenueResult[0]);
        } catch (error) {
            conn.release();
            console.log(error);
            return res.status(500).send({ message: error.message || "Server error" });
        }
    },
    getNetSales: async (req, res) => {
        console.log("Jalan /sales/net-sales");
        const conn = await connection.promise().getConnection();
        const {filter_year, role_id, warehouse_id} = req.headers;

        try {
            let sql;
            let queryParameter;

            if (parseInt(role_id) === 1) {
                sql = `
                    SELECT 
                    SUM(IF(month = 'Jan', net_sales, 0)) AS 'January',
                    SUM(IF(month = 'Feb', net_sales, 0)) AS 'February',
                    SUM(IF(month = 'Mar', net_sales, 0)) AS 'March',
                    SUM(IF(month = 'Apr', net_sales, 0)) AS 'April',
                    SUM(IF(month = 'May', net_sales, 0)) AS 'May',
                    SUM(IF(month = 'Jun', net_sales, 0)) AS 'June',
                    SUM(IF(month = 'Jul', net_sales, 0)) AS 'July',
                    SUM(IF(month = 'Aug', net_sales, 0)) AS 'August',
                    SUM(IF(month = 'Sep', net_sales, 0)) AS 'September',
                    SUM(IF(month = 'Oct', net_sales, 0)) AS 'October',
                    SUM(IF(month = 'Nov', net_sales, 0)) AS 'November',
                    SUM(IF(month = 'Dec', net_sales, 0)) AS 'December'
                        FROM (SELECT DATE_FORMAT(o.create_on, "%b") AS month, IFNULL((SUM(od.qty) * p.price) - (SUM(od.qty) * p.product_cost), 0) AS net_sales
                            FROM product AS p
                            JOIN order_detail od
                            ON p.id = od.product_id
                            JOIN orders o
                            ON od.orders_id = o.id
                            WHERE o.create_on <= NOW() AND o.create_on >= DATE_ADD(NOW(), interval - 12 MONTH) AND status_id = ? AND YEAR(o.create_on) = ?
                            GROUP BY DATE_FORMAT(o.create_on, "%m-%Y")) AS sub_table;
                `;
                queryParameter = [5, parseInt(filter_year)];
            } else {
                sql = `
                    SELECT 
                    SUM(IF(month = 'Jan', net_sales, 0)) AS 'January',
                    SUM(IF(month = 'Feb', net_sales, 0)) AS 'February',
                    SUM(IF(month = 'Mar', net_sales, 0)) AS 'March',
                    SUM(IF(month = 'Apr', net_sales, 0)) AS 'April',
                    SUM(IF(month = 'May', net_sales, 0)) AS 'May',
                    SUM(IF(month = 'Jun', net_sales, 0)) AS 'June',
                    SUM(IF(month = 'Jul', net_sales, 0)) AS 'July',
                    SUM(IF(month = 'Aug', net_sales, 0)) AS 'August',
                    SUM(IF(month = 'Sep', net_sales, 0)) AS 'September',
                    SUM(IF(month = 'Oct', net_sales, 0)) AS 'October',
                    SUM(IF(month = 'Nov', net_sales, 0)) AS 'November',
                    SUM(IF(month = 'Dec', net_sales, 0)) AS 'December'
                        FROM (SELECT DATE_FORMAT(o.create_on, "%b") AS month, IFNULL((SUM(od.qty) * p.price) - (SUM(od.qty) * p.product_cost), 0) AS net_sales
                            FROM product AS p
                            JOIN order_detail od
                            ON p.id = od.product_id
                            JOIN orders o
                            ON od.orders_id = o.id
                            WHERE o.create_on <= NOW() AND o.create_on >= DATE_ADD(NOW(), interval - 12 MONTH) AND status_id = ? AND YEAR(o.create_on) = ? AND warehouse_id = ?
                            GROUP BY DATE_FORMAT(o.create_on, "%m-%Y")) AS sub_table;
                `;
                queryParameter = [5, parseInt(filter_year), parseInt(warehouse_id)];
            };
            
            const [netSalesResult] = await conn.query(sql, queryParameter);

            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            for (let i = 0; i < monthNames.length; i++) {
                netSalesResult[0][monthNames[i]] = parseInt(netSalesResult[0][monthNames[i]]);
            }; //* Merubah hasil masing2 bulan menjadi data type numbers

            conn.release();
            return res.status(200).send(netSalesResult[0]);
        } catch (error) {
            conn.release();
            console.log(error);
            return res.status(500).send({ message: error.message || "Server error" });
        }
    },
    getYearNetSales: async (req, res) => {
        console.log("Jalan /sales/year-net-sales");
        const conn = await connection.promise().getConnection();
        const {filter_year, role_id, warehouse_id} = req.headers;

        try {
            let sql;
            let queryParameter;

            if (parseInt(role_id) === 1) {
                sql = `
                    SELECT IFNULL(SUM(net_sales), 0) AS total_yearly
                    FROM (SELECT DATE_FORMAT(o.create_on, "%b") AS month, IFNULL((SUM(od.qty) * p.price) - (SUM(od.qty) * p.product_cost), 0) AS net_sales
                        FROM product AS p
                        JOIN order_detail od
                        ON p.id = od.product_id
                        JOIN orders o
                        ON od.orders_id = o.id
                        WHERE o.create_on <= NOW() AND o.create_on >= DATE_ADD(NOW(), interval - 12 MONTH) AND status_id = ? AND YEAR(o.create_on) = ?
                        GROUP BY DATE_FORMAT(o.create_on, "%m-%Y")) AS sub_table;
                `;
                queryParameter = [5, parseInt(filter_year)];
            } else {
                sql = `
                    SELECT IFNULL(SUM(net_sales), 0) AS total_yearly
                    FROM (SELECT DATE_FORMAT(o.create_on, "%b") AS month, IFNULL((SUM(od.qty) * p.price) - (SUM(od.qty) * p.product_cost), 0) AS net_sales
                        FROM product AS p
                        JOIN order_detail od
                        ON p.id = od.product_id
                        JOIN orders o
                        ON od.orders_id = o.id
                        WHERE o.create_on <= NOW() AND o.create_on >= DATE_ADD(NOW(), interval - 12 MONTH) AND status_id = ? AND YEAR(o.create_on) = ? AND warehouse_id = ?
                        GROUP BY DATE_FORMAT(o.create_on, "%m-%Y")) AS sub_table;
                `;
                queryParameter = [5, parseInt(filter_year), parseInt(warehouse_id)];
            };
            
            const [yearNetResult] = await conn.query(sql, queryParameter);

            conn.release();
            return res.status(200).send(yearNetResult[0]);
        } catch (error) {
            conn.release();
            console.log(error);
            return res.status(500).send({ message: error.message || "Server error" });
        }
    },
    getStatusContribution: async (req, res) => {
        console.log("Jalan /sales/status-contribution");
        const conn = await connection.promise().getConnection();
        const {filter_year, role_id, warehouse_id} = req.headers;

        try {
            let sql;
            let queryParameter;

            if (parseInt(role_id) === 1) {
                sql = `
                    SELECT 
                    so.status, 
                    COUNT(o.status_id) AS transaction_count, 
                    ROUND(COUNT(o.status_id) * 100 / (SELECT COUNT(status_id) AS c FROM orders WHERE YEAR(create_on) = ?), 1) AS contribution 
                    FROM orders AS o
                        JOIN status_order so
                        ON o.status_id = so.id
                        WHERE YEAR(o.create_on) = ? 
                        GROUP BY status 
                        ORDER BY so.id ASC;
                `;
                queryParameter = [parseInt(filter_year), parseInt(filter_year)];
            } else {
                sql = `
                    SELECT 
                    so.status, 
                    COUNT(o.status_id) AS transaction_count, 
                    ROUND(COUNT(o.status_id) * 100 / (SELECT COUNT(status_id) AS c FROM orders WHERE YEAR(create_on) = ? AND warehouse_id = ?), 1) AS contribution 
                    FROM orders AS o
                        JOIN status_order so
                        ON o.status_id = so.id
                        WHERE YEAR(o.create_on) = ? AND warehouse_id = ?
                        GROUP BY status 
                        ORDER BY so.id ASC;
                `;
                queryParameter = [parseInt(filter_year), parseInt(warehouse_id), parseInt(filter_year), parseInt(warehouse_id)];
            };

            const [statusResult] = await conn.query(sql, queryParameter);
            
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
        const {filter_year, role_id, warehouse_id} = req.headers;

        try {
            let sql;
            let queryParameter;

            if (parseInt(role_id) === 1) {
                sql = `
                    SELECT od.product_id, p.name, SUM(od.qty) AS qty_sold FROM order_detail AS od
                    JOIN orders o
                    ON od.orders_id = o.id
                    JOIN product p
                    ON od.product_id = p.id
                    WHERE o.status_id = ? AND YEAR(o.create_on) = ?
                    GROUP BY od.product_id
                    ORDER BY qty_sold DESC
                    LIMIT 5;
                `;
                queryParameter = [5, parseInt(filter_year)];
            } else {
                sql = `
                    SELECT od.product_id, p.name, SUM(od.qty) AS qty_sold FROM order_detail AS od
                    JOIN orders o
                    ON od.orders_id = o.id
                    JOIN product p
                    ON od.product_id = p.id
                    WHERE o.status_id = ? AND YEAR(o.create_on) = ? AND warehouse_id = ?
                    GROUP BY od.product_id
                    ORDER BY qty_sold DESC
                    LIMIT 5;
                `;
                queryParameter = [5, parseInt(filter_year), parseInt(warehouse_id)];
            };

            const [topProdResult] = await conn.query(sql, queryParameter);

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
        const {filter_year, role_id, warehouse_id} = req.headers;

        try {
            let sql;
            let queryParameter;

            if (parseInt(role_id) === 1) {
                sql = `
                    SELECT od.product_id, p.name, SUM(od.price) AS sales_value FROM order_detail AS od
                    JOIN orders o
                    ON od.orders_id = o.id
                    JOIN product p
                    ON od.product_id = p.id
                    WHERE o.status_id = ? AND YEAR(o.create_on) = ?
                    GROUP BY od.product_id
                    ORDER BY sales_value DESC
                    LIMIT 5;
                `;
                queryParameter = [5, parseInt(filter_year)];
            } else {
                sql = `
                    SELECT od.product_id, p.name, SUM(od.price) AS sales_value FROM order_detail AS od
                    JOIN orders o
                    ON od.orders_id = o.id
                    JOIN product p
                    ON od.product_id = p.id
                    WHERE o.status_id = ? AND YEAR(o.create_on) = ? AND warehouse_id = ?
                    GROUP BY od.product_id
                    ORDER BY sales_value DESC
                    LIMIT 5;
                `;
                queryParameter = [5, parseInt(filter_year), parseInt(warehouse_id)];
            };

            const [topProdResult] = await conn.query(sql, queryParameter);

            conn.release();
            return res.status(200).send(topProdResult);
        } catch (error) {
            conn.release();
            console.log(error);
            return res.status(500).send({ message: error.message || "Server error" });
        }
    },
    getCategoryContribution: async (req, res) => {
        console.log("Jalan /sales/category-contribution");
        const conn = await connection.promise().getConnection();
        const {filter_year, role_id, warehouse_id} = req.headers;

        try {
            let sql;
            let queryParameter;

            if (parseInt(role_id) === 1) {
                sql = `
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
                queryParameter = [5, parseInt(filter_year), 5, parseInt(filter_year)];
            } else {
                sql = `
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
                            WHERE o.status_id = ? AND YEAR(o.create_on) = ? AND warehouse_id = ?
                            GROUP BY c.category
                            ORDER BY amount DESC;
                `
                queryParameter = [5, parseInt(filter_year), 5, parseInt(filter_year), parseInt(warehouse_id)];
            };

            const [categoryResult] = await conn.query(sql, queryParameter);

            conn.release();
            return res.status(200).send(categoryResult);
        } catch (error) {
            conn.release();
            console.log(error);
            return res.status(500).send({ message: error.message || "Server error" });
        }
    },
    getTotalProdSold: async (req, res) => {
        console.log("Jalan /sales/prod-sold");
        const conn = await connection.promise().getConnection();
        const {filter_year, role_id, warehouse_id} = req.headers;

        try {
            let sql;
            let queryParameter;

            if (parseInt(role_id) === 1) {
                sql = `
                    SELECT IFNULL(SUM(qty), 0) AS total_qty_sold FROM order_detail AS od
                    JOIN orders o
                    ON od.orders_id = o.id
                    WHERE status_id = ? AND YEAR(o.create_on) = ?;
                `;
                queryParameter = [5, parseInt(filter_year)];
            } else {
                sql = `
                    SELECT IFNULL(SUM(qty), 0) AS total_qty_sold FROM order_detail AS od
                    JOIN orders o
                    ON od.orders_id = o.id
                    WHERE status_id = ? AND YEAR(o.create_on) = ? AND warehouse_id = ?;
                `;
                queryParameter = [5, parseInt(filter_year), parseInt(warehouse_id)];
            };

            const [usersResult] = await conn.query(sql, queryParameter);

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
        let {filter_year, role_id, warehouse_id} = req.headers;

        filter_year = parseInt(filter_year);
        role_id = parseInt(role_id);
        warehouse_id = parseInt(warehouse_id);

        try {
            let sql;
            let queryParameter;

            if (role_id === 1) {
                sql = `
                    SELECT u.id AS user_id, u.username, SUM(od.price) AS total_transaction_value FROM user AS u
                    JOIN orders o
                    ON u.id = o.user_id
                    JOIN order_detail od
                    ON o.id = od.orders_id
                    WHERE o.status_id = ? AND YEAR(o.create_on) = ?
                    GROUP BY u.id
                    ORDER BY total_transaction_value DESC
                    LIMIT 5;
                `;
                queryParameter = [5, filter_year];
            } else {
                sql = `
                    SELECT u.id AS user_id, u.username, SUM(od.price) AS total_transaction_value FROM user AS u
                    JOIN orders o
                    ON u.id = o.user_id
                    JOIN order_detail od
                    ON o.id = od.orders_id
                    WHERE o.status_id = ? AND YEAR(o.create_on) = ? AND o.warehouse_id = ?
                    GROUP BY u.id
                    ORDER BY total_transaction_value DESC
                    LIMIT 5;
                `;
                queryParameter = [5, filter_year, warehouse_id];
            };
            
            const [topProdResult] = await conn.query(sql, queryParameter);

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
    getAverageTransaction: async (req, res) => {
        console.log("Jalan /sales/average-transaction");
        const conn = await connection.promise().getConnection();
        const {filter_year, role_id, warehouse_id} = req.headers;

        try {
            let sql;
            let queryParameter;

            if (parseInt(role_id) === 1) {
                sql = `
                    SELECT IFNULL(ROUND(AVG(total_price), 0), 0) AS avg_transaction 
                        FROM (SELECT SUM(od.price) AS total_price 
                            FROM orders AS o
                            JOIN order_detail od
                            ON o.id = od.orders_id
                            WHERE o.status_id = ? AND YEAR(o.create_on) = ?
                            GROUP BY od.orders_id) AS shadow_table;
                `;
                queryParameter = [5, parseInt(filter_year)];
            } else {
                sql = `
                    SELECT IFNULL(ROUND(AVG(total_price), 0), 0) AS avg_transaction 
                        FROM (SELECT SUM(od.price) AS total_price 
                            FROM orders AS o
                            JOIN order_detail od
                            ON o.id = od.orders_id
                            WHERE o.status_id = ? AND YEAR(o.create_on) = ? AND o.warehouse_id = ?
                            GROUP BY od.orders_id) AS shadow_table;
                `;
                queryParameter = [5, parseInt(filter_year), parseInt(warehouse_id)];
            };
            
            const [avgTransactionResult] = await conn.query(sql, queryParameter);

            conn.release();
            return res.status(200).send(avgTransactionResult[0]);
        } catch (error) {
            conn.release();
            console.log(error);
            return res.status(500).send({ message: error.message || "Server error" });
        }
    },
    getTotalOrders: async (req, res) => {
        console.log("Jalan /sales/total-orders");
        const conn = await connection.promise().getConnection();
        const {filter_year, role_id, warehouse_id} = req.headers;

        try {
            let sql;
            let queryParameter;

            if (parseInt(role_id) === 1) {
                sql = `
                    SELECT COUNT(id) AS total_orders FROM orders AS o
                    WHERE YEAR(o.create_on) = ?;
                `;
                queryParameter = parseInt(filter_year);
            } else {
                sql = `
                    SELECT COUNT(id) AS total_orders FROM orders AS o
                    WHERE YEAR(o.create_on) = ? AND o.warehouse_id = ?;
                `;
                queryParameter = [parseInt(filter_year), parseInt(warehouse_id)];
            };

            const [ordersResult] = await conn.query(sql, queryParameter);

            conn.release();
            return res.status(200).send(ordersResult[0]);
        } catch (error) {
            conn.release();
            console.log(error);
            return res.status(500).send({ message: error.message || "Server error" });
        }
    },
}