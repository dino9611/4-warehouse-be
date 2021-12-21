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
            SELECT p.images, p.id, CONCAT(c.category, "-", YEAR(p.create_on), "0", p.id) AS SKU,p.name, p.category_id, c.category, p.weight, p.price, p.product_cost, total_stock, description FROM product AS p
            JOIN category c
            ON p.category_id = c.id
            JOIN (SELECT product_id, SUM(stock) AS total_stock FROM stock
            WHERE ready_to_sent = ?
            GROUP BY product_id) AS s
            ON s.product_id = p.id
            WHERE is_delete = ?
            GROUP BY p.id
            ORDER BY p.id
            LIMIT ? OFFSET ?;
        `;
      const [productsResult] = await conn.query(sql, [
        0,
        0,
        parseInt(limit),
        parseInt(offset)
      ]);

      sql = `SELECT COUNT(id) AS products_total FROM product`;
      let [productsTotal] = await conn.query(sql);
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
              WHERE u.role_id = ?;
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
}
};