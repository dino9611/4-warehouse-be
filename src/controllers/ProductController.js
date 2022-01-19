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
  editProdNoImg: async (req, res) => {
    console.log("Jalan /product/edit/:id");
    const conn = await connection.promise().getConnection();
    const { id } = req.params;
    const { name, category_id, weight, price, product_cost, description } =
      req.body;

    try {
      await conn.beginTransaction(); // Aktivasi table tidak permanen agar bisa rollback/commit permanent

      let sql = `Update product SET ? WHERE id = ?;`;
      await conn.query(sql, [
        {
          name: name,
          category_id: category_id,
          weight: weight,
          price: price,
          product_cost: product_cost,
          description: description,
        },
        id,
      ]);
      await conn.commit(); // Commit permanent data diupload ke MySql klo berhasil
      conn.release();
      return res.status(200).send({ message: "Edit Success" });
    } catch (error) {
      await conn.rollback(); // Rollback data klo terjadi error/gagal
      conn.release();
      console.log(error);
      return res.status(500).send({ message: error.message || "Server error" });
    }
  },
  editProdImg: async (req, res) => {
    console.log("Jalan /product/edit/image/:id");
    const conn = await connection.promise().getConnection();
    const { id } = req.params;
    const { image_to_del, img_del_index } = req.headers;

    const { images } = req.files;
    let newPath = `"/assets/images/uploaded/${req.categoryFolder}/${images[0].filename}"`; // Utk menyiapkan file pathname baru agar bisa upload ke db sebagai JSON

    try {
      await conn.beginTransaction(); // Aktivasi table tidak permanen agar bisa rollback/commit permanent

      let sql = "SELECT images FROM product WHERE id = ?"; // Fetch data image terkait product id yg dituju
      const [imgResult] = await conn.query(sql, id);

      let newImgEditArr = imgResult[0].images; // Hasil array data images
      newImgEditArr.forEach((val, index) => {
        // Looping & diberi "" agar nantinya bisa dimasukan kembali sebagai JSON ke MySql
        newImgEditArr[index] = `"${val}"`;
      });
      newImgEditArr.splice(parseInt(img_del_index), 1, newPath); // Masukan filepath image baru kedalam array sesuai index image yang diganti/edit dari FE
      if (!newImgEditArr[1]) {
        newImgEditArr.splice(1, 1); // Bila image kosong ditengah (index 1, diantara index 0 & 2), image index 2 otomatis menjadi index 1
      }

      sql = `Update product SET ? WHERE id = ?;`;
      await conn.query(sql, [{ images: `[${newImgEditArr}]` }, id]);

      await conn.commit(); // Commit permanent data diupload ke MySql klo berhasil
      conn.release();
      if (image_to_del) {
        fs.unlinkSync("./public" + image_to_del); // Menghapus file image sebelumnya yang sekarang digantikan image baru
        return res.status(200).send({ message: "Edit Image Success" });
      } else {
        // Bila tidak ada file image sebelumnya, maka langsung di-selesaikan
        return res.status(200).send({ message: "Edit Image Success" });
      }
    } catch (error) {
      await conn.rollback(); // Rollback data klo terjadi error/gagal
      conn.release();
      console.log(error);
      return res.status(500).send({ message: error.message || "Server error" });
    }
  },
  deleteProdImg: async (req, res) => {
    console.log("Jalan /product/delete/image/:id");
    const conn = await connection.promise().getConnection();
    const { id } = req.params;
    const { index_del_img, prev_img_path } = req.headers;

    try {
      await conn.beginTransaction(); // Aktivasi table tidak permanen agar bisa rollback/commit permanent

      let sql = "SELECT images FROM product WHERE id = ?"; // Fetch data image terkait product id yg dituju
      const [imgResult] = await conn.query(sql, id);

      let newImgArray = imgResult[0].images; // Hasil array data images
      newImgArray.forEach((val, index) => {
        // Looping & diberi "" agar nantinya bisa dimasukan kembali sebagai JSON ke MySql
        if (index == index_del_img) {
          newImgArray[index] = "";
        } else {
          newImgArray[index] = `"${val}"`;
        }
      });
      newImgArray.splice(parseInt(index_del_img), 1); // Delete file image sebelumnya dgn menyesuaikan index delete yg diterima dari FE

      sql = `Update product SET ? WHERE id = ?;`;
      await conn.query(sql, [{ images: `[${newImgArray}]` }, id]);

      await conn.commit(); // Commit permanent data diupload ke MySql klo berhasil
      conn.release();
      fs.unlinkSync("./public" + prev_img_path); // Menghapus file image sebelumnya yang sekarang digantikan image baru
      return res.status(200).send({ message: "Delete Image Success" });
    } catch (error) {
      await conn.rollback(); // Rollback data klo terjadi error/gagal
      conn.release();
      console.log(error);
      return res.status(500).send({ message: error.message || "Server error" });
    }
  },
  deleteProduct: async (req, res) => {
    console.log("Jalan /product/delete/:prodId");
    const prodId = req.params.prodId;
    const conn = await connection.promise().getConnection();

    try {
      await conn.beginTransaction(); // Aktivasi table tidak permanen agar bisa rollback/commit permanent

      let sql = `SELECT id FROM product where id = ?;`;
      const [result] = await conn.query(sql, [prodId]);

      if (!result.length) {
        conn.release();
        return res.send({
          failMessage: "Product ID not found, please contact Super Admin",
        });
      } else {
        sql = `UPDATE product SET is_delete = ? WHERE id = ?;`;
        await conn.query(sql, [1, prodId]);

        await conn.commit(); // Commit permanent data diupload ke MySql klo berhasil
        conn.release();
        return res
          .status(200)
          .send({ message: "Delete Success (list will refresh)" });
      }
    } catch (error) {
      await conn.rollback(); // Rollback data klo terjadi error/gagal
      conn.release();
      console.log(error);
      return res.status(500).send({ message: error.message || "Server error" });
    }
  },
  editProductStock: async (req, res) => {
    console.log("Jalan /product/edit/stock");
    const { warehouse_id, product_id, new_stock } = req.body;
    const conn = await connection.promise().getConnection();

    try {
      await conn.beginTransaction(); // Aktivasi table tidak permanen agar bisa rollback/commit permanent

      let sql = `INSERT INTO stock SET ?`;
      let addStockData = {
        warehouse_id: warehouse_id,
        product_id: product_id,
        stock: new_stock,
        ready_to_sent: 0,
      };

      await conn.query(sql, addStockData);

      await conn.commit(); // Commit permanent data diupload ke MySql klo berhasil
      conn.release();
      return res.status(200).send({ message: "Edit stock success!" });
    } catch (error) {
      await conn.rollback(); // Rollback data klo terjadi error/gagal
      conn.release();
      console.log(error);
      return res.status(500).send({ message: error.message || "Server error" });
    }
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

  getHotProducts: async (req, res) => {
    const connDb = connection.promise();

    try {
      let sql = `select p.id, p.name, p.price, p.weight, c.category, p.product_cost, p.description, p.images,  sum(qty) as total_qty, total_stock from product p
      join order_detail od
      on od.product_id = p.id
      join orders o
      on o.id = od.orders_id
      join category c
      on c.id = p.category_id
      join (select product_id, sum(stock) as total_stock from stock
      group by product_id) s
      on s.product_id = p.id
      where o.status_id not in (1,2) and p.is_delete = 0 and total_stock != 0
      group by od.product_id
      order by total_qty desc
      limit 5`;
      const [hotProducts] = await connDb.query(sql);

      return res.status(200).send(hotProducts);
    } catch (error) {
      return res.status(500).send({ message: error.message });
    }
  },

  getProductBycategory: async (req, res) => {
    const connDb = connection.promise();

    try {
      let sql = `select p.id, name, price, weight, category_id, c.category, total_stock, description, images from product p
      join category c
      on c.id = p.category_id
      join (select product_id, sum(stock) as total_stock from stock
      group by product_id) s
      on s.product_id = p.id
      where category_id = ? and is_delete = 0 and total_stock != 0`;

      const [dataProductByCategory] = await connDb.query(sql, [
        req.params.categoryId,
        parseInt(req.query.limit),
      ]);

      return res.status(200).send(dataProductByCategory);
    } catch (error) {
      return res.status(500).send({ message: error.message });
    }
  },
};
