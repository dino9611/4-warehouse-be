const { connection } = require("../connection");

module.exports = {
  getProduct: async (req, res) => {
    const connDb = await connection.promise().getConnection();
    const { name, pricemin, pricemax, category, sort, page, limit } = req.query;
    const offset = parseInt(page) * parseInt(limit);

    try {
      let filterSql = "";
      let sortSql = "";

      if (name) {
        filterSql += ` and name like ${connDb.escape(`%${name}%`)}`;
      }
      if (category) {
        filterSql += ` and category_id in (${connDb.escape(
          category.split(" ").map((el) => parseInt(el))
        )})`;
      }
      if (pricemin) {
        filterSql += ` and price >= ${connDb.escape(parseInt(pricemin))}`;
      }
      if (pricemax) {
        filterSql += ` and price <= ${connDb.escape(parseInt(pricemax))}`;
      }

      if (sort == "nameasc") {
        sortSql = ` order by name asc`;
      } else if (sort == "namedesc") {
        sortSql = ` order by name desc`;
      } else if (sort == "priceasc") {
        sortSql = ` order by price asc`;
      } else if (sort == "pricedesc") {
        sortSql = ` order by price desc`;
      }
      console.log(filterSql);

      let sql = `select p.id, name, price, weight, category_id, c.category, description, images from product p
      join category c
      on c.id = p.category_id
      where is_delete = 0 ${filterSql}
      ${sortSql}
      limit ?,?`;

      let [dataProduct] = await connDb.query(sql, [
        parseInt(offset),
        parseInt(limit),
      ]);

      sql = `select count(id) as total from product where true ${filterSql} ${sortSql}`;
      let [totalProduct] = await connDb.query(sql);

      res.set("x-total-count", totalProduct[0].total);
      connDb.release();

      return res.status(200).send(dataProduct);
    } catch (error) {
      console.log(error);
    }
  },

  getCategory: async (req, res) => {
    const connDb = connection.promise();

    try {
      let sql = "select * from category";
      let [category] = await connDb.query(sql);

      return res.status(200).send(category);
    } catch (error) {
      console.log(error.message);
    }
  },
};
