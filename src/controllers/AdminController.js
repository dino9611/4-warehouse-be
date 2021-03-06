const { connection } = require("../connection");
const { hashPass } = require("./../helpers");

module.exports = {
  getAdminProducts: async (req, res) => {
    console.log("Jalan /admin/product/pagination");
    const conn = await connection.promise().getConnection();
    const { page, limit } = req.query; // Dari frontend
    let offset = page * limit; // Semacam utk slice data, start data drimana

    try {
      let sql = `
            SELECT p.images, p.id, CONCAT(c.category, "-", YEAR(p.create_on), "0", p.id) AS SKU, p.name, p.category_id, c.category, p.weight, p.price, p.product_cost, total_stock, description FROM product AS p
            JOIN category c
            ON p.category_id = c.id
            JOIN (SELECT product_id, SUM(stock) AS total_stock FROM stock
            WHERE ready_to_sent = ?
            GROUP BY product_id) AS s
            ON s.product_id = p.id
            WHERE is_delete = ?
            GROUP BY p.id
            ORDER BY p.create_on DESC
            LIMIT ? OFFSET ?;
        `;
      const [productsResult] = await conn.query(sql, [
        0,
        0,
        parseInt(limit),
        parseInt(offset)
      ]);

      sql = `SELECT COUNT(id) AS products_total FROM product WHERE is_delete = ?;`;
      let [productsTotal] = await conn.query(sql, 0);
      res.set("x-total-count", productsTotal[0].products_total);

      conn.release();
      return res.status(200).send(productsResult);
    } catch (error) {
      conn.release();
      console.log(error);
      return res.status(500).send({ message: error.message || "Server error" });
    };
  },
  getAdminList: async (req, res) => {
    console.log("Jalan /admin/list");
    const conn = await connection.promise().getConnection();

    try {
        let sql = `
              SELECT u.id, u.username, u.role_id, r.role, wa.warehouse_id, w.name AS warehouse_name FROM user AS u
              JOIN role r
              ON u.role_id = r.id
              JOIN warehouse_admin wa
              ON u.id = wa.user_id
              JOIN warehouse w
              ON wa.warehouse_id = w.id
              WHERE u.role_id = ?
              ORDER BY wa.warehouse_id;
          `;

        const [adminListResult] = await conn.query(sql, 2);

        conn.release();
        return res.status(200).send(adminListResult);
    } catch (error) {
        conn.release();
        console.log(error);
        return res.status(500).send({ message: error.message || "Server error" });
    };
  },
  addAdmin: async (req, res) => {
    console.log("Jalan /admin/add");
    const conn = await connection.promise().getConnection();

    // Destructure data input produk dari FE, utk insert ke MySql
    const {
      new_username,
      new_password,
      assign_warehouse
    } = req.body;

    try {
      await conn.beginTransaction(); // Aktivasi table tidak permanen agar bisa rollback/commit permanent

      let sql = `INSERT INTO user SET ?`;
      let addNewAdmin = {
        username: new_username,
        password: hashPass(new_password),
        role_id: 2,
        is_verified: 1
      };
      const [addAdminResult] = await conn.query(sql, addNewAdmin);
      const newAdminId = addAdminResult.insertId;

      sql = `INSERT INTO warehouse_admin SET ?`;
      let assignAdminWh = {
        user_id: newAdminId,
        warehouse_id: assign_warehouse
      };
      await conn.query(sql, assignAdminWh);

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
  getProdToEdit: async (req, res) => {
    console.log("Jalan /admin/product/detail");
    const conn = await connection.promise().getConnection();
    const { id } = req.query; // Dari frontend

    try {
      let sql = `
            SELECT p.images, p.id AS product_id, CONCAT(c.category, "-", YEAR(p.create_on), "0", p.id) AS SKU, p.name, p.category_id, c.category, p.weight, p.price, p.product_cost, description FROM product AS p
            JOIN category c
            ON p.category_id = c.id
            WHERE p.id = ?;
        `;
      const [productResult] = await conn.query(sql, [id]);

      conn.release();
      return res.status(200).send(productResult[0]);
    } catch (error) {
      conn.release();
      console.log(error);
      return res.status(500).send({ message: error.message || "Server error" });
    };
  },
  getWarehouseProducts: async (req, res) => {
    console.log("Jalan /admin/warehouse-product/pagination");
    const conn = await connection.promise().getConnection();
    const { page, limit, whid } = req.query; // Dari frontend
    let offset = page * limit; // Semacam utk slice data, start data drimana

    try {
      let sql = `
            SELECT p.images, p.id, CONCAT(c.category, "-", YEAR(p.create_on), "0", p.id) AS SKU, p.name, c.category, p.price, IFNULL(total_stock, 0) AS warehouse_stock, description FROM product AS p
            JOIN category c
            ON p.category_id = c.id
            LEFT JOIN (SELECT product_id, IFNULL(SUM(stock), 0) AS total_stock FROM stock
            WHERE ready_to_sent = ? AND warehouse_id = ?
            GROUP BY product_id) AS s
            ON s.product_id = p.id
            WHERE is_delete = ?
            GROUP BY p.id
            ORDER BY p.id
            LIMIT ? OFFSET ?;
        `;
      const [productsResult] = await conn.query(sql, [
        0,
        parseInt(whid),
        0,
        parseInt(limit),
        parseInt(offset)
      ]);

      sql = `SELECT COUNT(id) AS products_total FROM product WHERE is_delete = ?;`;
      let [productsTotal] = await conn.query(sql, 0);
      res.set("x-total-count", productsTotal[0].products_total);

      conn.release();
      return res.status(200).send(productsResult);
    } catch (error) {
      conn.release();
      console.log(error);
      return res.status(500).send({ message: error.message || "Server error" });
    };
  },
  getStockBreakdown: async (req, res) => {
    console.log("Jalan /admin/stock-breakdown/:prodId");
    const conn = await connection.promise().getConnection();
    const prodId = parseInt(req.params.prodId); // Dari frontend

    try {
      let sql = `
          SELECT s.warehouse_id, w.name, SUM(s.stock) AS total_stock FROM stock AS s
          JOIN warehouse w
          ON s.warehouse_id = w.id
          WHERE s.ready_to_sent = 0 AND s.product_id = ?
          GROUP BY s.warehouse_id
          ORDER BY s.warehouse_id;
        `;
      const [stockResult] = await conn.query(sql, prodId);

      conn.release();
      return res.status(200).send(stockResult);
    } catch (error) {
      conn.release();
      console.log(error);
      return res.status(500).send({ message: error.message || "Server error" });
    };
  }
};