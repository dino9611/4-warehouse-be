const { connection } = require("../connection");

module.exports = {
  getAdminProducts: async (req, res) => {
    console.log("Jalan /admin/product/pagination");
    const conn = await connection.promise().getConnection();
    const { page, limit } = req.query; // Dari frontend
    let offset = page * limit; // Semacam utk slice data, start data drimana

    try {
      let sql = `
            SELECT p.images, p.id, CONCAT(c.category, "-", YEAR(p.create_on), "0", p.id) AS SKU,p.name, c.category, p.price, total_stock FROM product AS p
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
  }
};