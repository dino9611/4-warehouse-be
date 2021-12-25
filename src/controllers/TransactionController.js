const { connection } = require("../connection");

module.exports = {
  addToCart: async (req, res) => {
    const connDb = await connection.promise().getConnection();
    const { user_id, product_id, qty } = req.body;
    let cartId = null;

    try {
      await connDb.beginTransaction();

      let sql = `select id from cart where user_id = ? and is_checkout = 0`;
      let [cartUser] = await connDb.query(sql, [user_id]);

      if (!cartUser.length) {
        let dataCart = {
          user_id,
          is_checkout: 0,
        };

        sql = `insert into cart set ?`;
        let [cart] = await connDb.query(sql, [dataCart]);

        cartId = cart.insertId;
      } else {
        cartId = cartUser[0].id;
      }

      sql = `select id, qty from cart_detail where cart_id = ? and product_id = ?`;
      let [cartDetail] = await connDb.query(sql, [cartId, product_id]);

      sql = `select p.id, total_stock from product p
      join (select product_id, sum(stock) as total_stock from stock
      group by product_id) s
      on s.product_id = p.id
      where p.id = ?`;
      let [cekStock] = await connDb.query(sql, [product_id]);

      if (cartDetail.length) {
        let totalQty = cartDetail[0].qty + parseInt(qty);

        if (totalQty > cekStock[0].total_stock) {
          throw { message: "Jumlah yang anda masukkan melebihi stock" };
        }

        sql = `update cart_detail set ? where id = ?`;
        await connDb.query(sql, [
          { qty: cartDetail[0].qty + parseInt(qty) },
          cartDetail[0].id,
        ]);
      } else {
        let dataCartDetail = {
          cart_id: cartId,
          product_id,
          qty: parseInt(qty),
        };

        sql = `insert into cart_detail set ?`;
        await connDb.query(sql, [dataCartDetail]);
      }

      await connDb.commit();

      connDb.release();

      return res.status(200).send({ message: "Produk berhasil ditambahkan" });
    } catch (error) {
      await connDb.rollback();
      connDb.release();
      return res.status(500).send({ message: error.message });
    }
  },

  checkStock: async (req, res) => {
    const connDb = await connection.promise().getConnection();

    try {
      let errorStock = [];

      let sql = `select id from cart where user_id = ? and is_checkout = 0`;
      let [dataCart] = await connDb.query(sql, req.params.userId);

      sql = `select product_id, qty from cart_detail where cart_id = ? and is_deleted = 0`;
      let [dataCartDetail] = await connDb.query(sql, dataCart[0].id);

      for (let i = 0; i < dataCartDetail.length; i++) {
        sql = `select product_id, sum(stock) as total_stock from stock where product_id = ?`;
        let [dataStock] = await connDb.query(sql, dataCartDetail[i].product_id);

        if (dataCartDetail[i].qty > parseInt(dataStock[0]?.total_stock)) {
          errorStock.push(dataCartDetail[i].product_id);
          console.log("tes");
        }
      }
      console.log(errorStock);
      connDb.release();

      return res.status(200).send(errorStock);
    } catch (error) {
      connDb.release();
      console.log(error);
      return res.status(500).send({ message: error.message });
    }
  },

  getCartDetail: async (req, res) => {
    const connDb = await connection.promise().getConnection();

    try {
      let sql = `select id from cart where user_id = ? and is_checkout = 0`;
      let [dataCart] = await connDb.query(sql, [req.params.userId]);

      sql = `select cd.id, cart_id, cd.product_id, p.name, p.images, c.category, p.price, p.weight, qty, total_stock from cart_detail cd
      join product p
      on cd.product_id = p.id
      join category c
      on p.category_id = c.id 
      join (select product_id, sum(stock) as total_stock from stock
      group by product_id) s
      on s.product_id = cd.product_id
      where cart_id = ? and is_deleted = 0`;
      let [dataCartDetail] = await connDb.query(sql, [dataCart[0].id]);

      connDb.release();

      return res.status(200).send(dataCartDetail);
    } catch (error) {
      connDb.release();
      return res.status(500).send({ message: error.message });
    }
  },

  deleteProductInCart: async (req, res) => {
    const connDb = connection.promise();

    console.log(req.params.cartDetailId);

    try {
      let sql = `update cart_detail set is_deleted = 1 where id = ?`;
      await connDb.query(sql, [req.params.cartDetailId]);

      return res.status(200).send({ message: "Berhasil dihapus" });
    } catch (error) {
      return res.status(500).send({ message: error.message });
    }
  },

  editQtyInCart: async (req, res) => {
    const connDb = connection.promise();

    try {
      let sql = `update cart_detail set qty = ? where id = ?`;
      await connDb.query(sql, [req.body.qty, req.params.cartDetailId]);

      return res.status(200).send({ message: "Berhasil menambah jumlah" });
    } catch (error) {
      return res.status(500).send({ message: error.message });
    }
  },

  checkout: async (req, res) => {
    const connDb = await connection.promise().getConnection();
    const {
      user_id,
      cart_id,
      shipping_fee,
      destination,
      bank_id,
      warehouse_id,
    } = req.body;

    try {
      await connDb.beginTransaction();

      if (
        !user_id &&
        !shipping_fee &&
        !destination &&
        !bank_id &&
        !warehouse_id
      ) {
        throw { message: "Kolom belum terisi semua" };
      }

      // Update is_checkout pada table cart menjadi 1

      sql = `update cart set ? where user_id = ? and is_checkout = 0`;
      await connDb.query(sql, [{ is_checkout: 1 }, user_id]);

      // Insert data baru ke tabel order

      let dataOrder = {
        user_id,
        shipping_fee,
        destination,
        bank_id,
        warehouse_id,
      };

      sql = `insert into orders set ?`;
      let [order] = await connDb.query(sql, dataOrder);

      // Get data cart detail dengan cart_id yang sesuai dengan user_id

      sql = `select product_id, qty from cart_detail where cart_id = ? and is_deleted = 0`;
      let [dataCartDetail] = await connDb.query(sql, cart_id);

      // Mulai looping untuk insert data ke stock dan insert data ke order detail

      for (let i = 0; i < dataCartDetail.length; i++) {
        const dataStock = {
          warehouse_id,
          product_id: dataCartDetail[i].product_id,
          stock: -dataCartDetail[i].qty,
          orders_id: order.insertId,
          ready_to_sent: 1,
        };

        sql = `insert into stock set ?`;
        await connDb.query(sql, dataStock);

        const dataOrderDetail = {
          orders_id: order.insertId,
          product_id: dataCartDetail[i].product_id,
          qty: dataCartDetail[i].qty,
        };

        sql = `insert into order_detail set ?`;
        await connDb.query(sql, dataOrderDetail);
      }

      connDb.release();

      await connDb.commit();

      return res
        .status(200)
        .send({ data: cart_id, message: "Berhasil checkout" });
    } catch (error) {
      connDb.release();
      await connDb.rollback();
      console.log(error);
      return res.status(500).send({ message: error.message });
    }
  },

  getBank: async (req, res) => {
    const connDb = connection.promise();

    try {
      let sql = `select * from bank`;
      let [dataBank] = await connDb.query(sql);

      return res.status(200).send(dataBank);
    } catch (error) {
      return res.status(500).send({ message: error.message });
    }
  },

  getAllTransactions: async (req, res) => {
    console.log("Jalan /transaction/all-transactions");
    const conn = await connection.promise().getConnection();

    try {
      let sql = `
        SELECT o.id, o.status_id, so.status, SUM(od.price) AS transaction_amount, o.create_on AS transaction_date FROM status_order AS so
        JOIN orders o
        ON so.id = o.status_id
        JOIN order_detail od
        ON o.id = od.orders_id
        GROUP BY od.orders_id
        ORDER BY o.id
        LIMIT ?;
      `
      const [transactionsResult] = await conn.query(sql, 10);

      for (let i = 0; i < transactionsResult.length; i++) {
          transactionsResult[i].transaction_amount = parseInt(transactionsResult[i].transaction_amount);
      };

      conn.release();
      return res.status(200).send(transactionsResult);
      } catch (error) {
          conn.release();
          console.log(error);
          return res.status(500).send({ message: error.message || "Server error" });
      }
  },
  getWaitPayTransactions: async (req, res) => {
    console.log("Jalan /transaction/wait-pay-transactions");
    const conn = await connection.promise().getConnection();

    try {
      let sql = `
        SELECT o.id, o.status_id, so.status, SUM(od.price) AS transaction_amount, o.create_on AS transaction_date FROM status_order AS so
        JOIN orders o
        ON so.id = o.status_id
        JOIN order_detail od
        ON o.id = od.orders_id
        WHERE o.status_id = ?
        GROUP BY od.orders_id
        ORDER BY o.id
        LIMIT ?;
      `
      const [transactionsResult] = await conn.query(sql, [1, 10]);

      for (let i = 0; i < transactionsResult.length; i++) {
          transactionsResult[i].transaction_amount = parseInt(transactionsResult[i].transaction_amount);
      };

      conn.release();
      return res.status(200).send(transactionsResult);
      } catch (error) {
          conn.release();
          console.log(error);
          return res.status(500).send({ message: error.message || "Server error" });
      }
  },
  getWaitConfirmTrans: async (req, res) => {
    console.log("Jalan /transaction/wait-confirm-transactions");
    const conn = await connection.promise().getConnection();

    try {
      let sql = `
        SELECT o.id, o.status_id, so.status, SUM(od.price) AS transaction_amount, o.create_on AS transaction_date FROM status_order AS so
        JOIN orders o
        ON so.id = o.status_id
        JOIN order_detail od
        ON o.id = od.orders_id
        WHERE o.status_id = ?
        GROUP BY od.orders_id
        ORDER BY o.id
        LIMIT ?;
      `
      const [transactionsResult] = await conn.query(sql, [2, 10]);

      for (let i = 0; i < transactionsResult.length; i++) {
          transactionsResult[i].transaction_amount = parseInt(transactionsResult[i].transaction_amount);
      };

      conn.release();
      return res.status(200).send(transactionsResult);
      } catch (error) {
          conn.release();
          console.log(error);
          return res.status(500).send({ message: error.message || "Server error" });
      }
  },
  getOnProcessTrans: async (req, res) => {
    console.log("Jalan /transaction/onprocess-transactions");
    const conn = await connection.promise().getConnection();

    try {
      let sql = `
        SELECT o.id, o.status_id, so.status, SUM(od.price) AS transaction_amount, o.create_on AS transaction_date FROM status_order AS so
        JOIN orders o
        ON so.id = o.status_id
        JOIN order_detail od
        ON o.id = od.orders_id
        WHERE o.status_id = ?
        GROUP BY od.orders_id
        ORDER BY o.id
        LIMIT ?;
      `
      const [transactionsResult] = await conn.query(sql, [3, 10]);

      for (let i = 0; i < transactionsResult.length; i++) {
          transactionsResult[i].transaction_amount = parseInt(transactionsResult[i].transaction_amount);
      };

      conn.release();
      return res.status(200).send(transactionsResult);
      } catch (error) {
          conn.release();
          console.log(error);
          return res.status(500).send({ message: error.message || "Server error" });
      }
  },
  getDelivTransactions: async (req, res) => {
    console.log("Jalan /transaction/delivery-transactions");
    const conn = await connection.promise().getConnection();

    try {
      let sql = `
        SELECT o.id, o.status_id, so.status, SUM(od.price) AS transaction_amount, o.create_on AS transaction_date FROM status_order AS so
        JOIN orders o
        ON so.id = o.status_id
        JOIN order_detail od
        ON o.id = od.orders_id
        WHERE o.status_id = ?
        GROUP BY od.orders_id
        ORDER BY o.id
        LIMIT ?;
      `
      const [transactionsResult] = await conn.query(sql, [4, 10]);

      for (let i = 0; i < transactionsResult.length; i++) {
          transactionsResult[i].transaction_amount = parseInt(transactionsResult[i].transaction_amount);
      };

      conn.release();
      return res.status(200).send(transactionsResult);
      } catch (error) {
          conn.release();
          console.log(error);
          return res.status(500).send({ message: error.message || "Server error" });
      }
  },
  getReceivedTransactions: async (req, res) => {
    console.log("Jalan /transaction/received-transactions");
    const conn = await connection.promise().getConnection();

    try {
      let sql = `
        SELECT o.id, o.status_id, so.status, SUM(od.price) AS transaction_amount, o.create_on AS transaction_date FROM status_order AS so
        JOIN orders o
        ON so.id = o.status_id
        JOIN order_detail od
        ON o.id = od.orders_id
        WHERE o.status_id = ?
        GROUP BY od.orders_id
        ORDER BY o.id
        LIMIT ?;
      `
      const [transactionsResult] = await conn.query(sql, [5, 10]);

      for (let i = 0; i < transactionsResult.length; i++) {
          transactionsResult[i].transaction_amount = parseInt(transactionsResult[i].transaction_amount);
      };

      conn.release();
      return res.status(200).send(transactionsResult);
      } catch (error) {
          conn.release();
          console.log(error);
          return res.status(500).send({ message: error.message || "Server error" });
      }
  },
  getFailTransactions: async (req, res) => {
    console.log("Jalan /transaction/fail-transactions");
    const conn = await connection.promise().getConnection();

    try {
      let sql = `
        SELECT o.id, o.status_id, so.status, SUM(od.price) AS transaction_amount, o.create_on AS transaction_date FROM status_order AS so
        JOIN orders o
        ON so.id = o.status_id
        JOIN order_detail od
        ON o.id = od.orders_id
        WHERE o.status_id = 6 OR o.status_id = 7
        GROUP BY od.orders_id
        ORDER BY o.id
        LIMIT ?;
      `
      const [transactionsResult] = await conn.query(sql, [6, 7, 10]);

      for (let i = 0; i < transactionsResult.length; i++) {
          transactionsResult[i].transaction_amount = parseInt(transactionsResult[i].transaction_amount);
      };

      conn.release();
      return res.status(200).send(transactionsResult);
      } catch (error) {
          conn.release();
          console.log(error);
          return res.status(500).send({ message: error.message || "Server error" });
      }
  },
};
