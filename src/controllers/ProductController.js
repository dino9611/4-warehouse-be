const { connection } = require("../connection");
const fs = require("fs");

module.exports = {
  getProdCategory: async (req, res) => {
    const conn = await connection.promise().getConnection();

    try {
      let sql = `SELECT id, category FROM category;`;

      const [categoryResult] = await conn.query(sql);

      conn.release();
      return res.status(200).send(categoryResult);
    } catch (error) {
      conn.release();
      console.log(error);
      return res.status(500).send({ message: error.message || "Server error" });
    }
  },
  addProduct: (folderTarget) => {
    return async (req, res) => {
      console.log("Jalan /product/add");
      const conn = await connection.promise().getConnection();

      // Parse data yg dikirim dari FE, karena dari FE dilakukan JSON.stringify
      const dataProduct = JSON.parse(req.body.dataProduct);
      const dataStock = JSON.parse(req.body.dataStock);

      // Menyiapkan array untuk insert multiple images ke MySql
      let imagePath = [];
      let path = `/assets/images/uploaded/${folderTarget}`;
      const { images } = req.files;
      images.forEach((val) => {
        imagePath.push(`"${path}/${val.filename}"`);
      });

      // Destructure data input produk dari FE, utk insert ke MySql
      const {
        prod_name,
        prod_category,
        prod_weight,
        prod_price,
        prod_cost,
        prod_desc,
      } = dataProduct;

      try {
        await conn.beginTransaction(); // Aktivasi table tidak permanen agar bisa rollback/commit permanent

        let sql = `INSERT INTO product SET ?`;
        let addDataProd = {
          images: `[${imagePath}]`,
          name: prod_name,
          category_id: prod_category,
          weight: prod_weight,
          price: prod_price,
          product_cost: prod_cost,
          description: prod_desc,
        };
        const [addResult] = await conn.query(sql, addDataProd);
        const newProdId = addResult.insertId;

        // Utk looping insert stock, jadi semua warehouse punya record produk yg sama walaupun stok kosong
        sql = `INSERT INTO stock SET ?`;
        for (let i = 0; i < dataStock.length; i++) {
          let addStock = {
            warehouse_id: dataStock[i].id,
            product_id: newProdId,
            stock: dataStock[i].stock,
          };
          await conn.query(sql, addStock);
        }

        await conn.commit(); // Commit permanent data diupload ke MySql klo berhasil
        conn.release();
        return res.status(200).send({ message: "Berhasil tambah produk" });
      } catch (error) {
        await conn.rollback(); // Rollback data klo terjadi error/gagal
        conn.release();
        console.log(error);
        return res
          .status(500)
          .send({ message: error.message || "Server error" });
      }
    };
  },

  // LIST PRODUK USER PAGE (GANGSAR)

  listProduct: async (req, res) => {
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

      let sql = `select p.id, name, price, weight, category_id, c.category, total_stock, description, images from product p
      join category c
      on c.id = p.category_id
      join (select product_id, sum(stock) as total_stock from stock
		  group by product_id) s
      on s.product_id = p.id
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

  getDetailedProduct: async (req, res) => {
    const connDb = connection.promise();

    try {
      let sql = `select p.id, name, price, weight, category_id, c.category, total_stock, description, images from product p
      join category c
      on c.id = p.category_id
      join (select product_id, sum(stock) as total_stock from stock
		  group by product_id) s
      on s.product_id = p.id
      where p.id = ? and is_delete = 0`;
      const [dataProduct] = await connDb.query(sql, [req.params.productId]);

      return res.status(200).send(dataProduct);
    } catch (error) {
      return res.status(500).send({ message: error.message });
    }
  },
};
