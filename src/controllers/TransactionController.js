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
    const { page, limit } = req.query; // Dari frontend
    let offset = page * limit; // Utk slice data, start data drimana

    try {
      let sql = `
        SELECT o.id, o.status_id, so.status, SUM(od.price) AS transaction_amount, IFNULL(o.shipping_fee, 0) AS shipping_fee, o.warehouse_id, w.name AS warehouse_name, o.payment_proof, o.create_on AS transaction_date FROM status_order AS so
        JOIN orders o
        ON so.id = o.status_id
        JOIN order_detail od
        ON o.id = od.orders_id
        JOIN warehouse w
        ON o.warehouse_id = w.id
        GROUP BY od.orders_id
        ORDER BY transaction_date DESC
        LIMIT ? OFFSET ?;
      `
      const [transactionsResult] = await conn.query(sql, [parseInt(limit), parseInt(offset)]);

      const dateOptions = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: "true"};

      for (let i = 0; i < transactionsResult.length; i++) {
          transactionsResult[i].transaction_amount = parseInt(transactionsResult[i].transaction_amount);
          transactionsResult[i].shipping_fee = parseInt(transactionsResult[i].shipping_fee);
          transactionsResult[i].transaction_date = transactionsResult[i].transaction_date.toLocaleString('id-ID', dateOptions);
      };

      sql = `SELECT COUNT(id) AS orders_total FROM orders;`;
      let [ordersTotal] = await conn.query(sql);
      res.set("x-total-count", ordersTotal[0].orders_total);

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
    const { page, limit } = req.query; // Dari frontend
    let offset = page * limit; // Utk slice data, start data drimana

    try {
      let sql = `
        SELECT o.id, o.status_id, so.status, SUM(od.price) AS transaction_amount, IFNULL(o.shipping_fee, 0) AS shipping_fee, o.warehouse_id, w.name AS warehouse_name, o.payment_proof, o.create_on AS transaction_date FROM status_order AS so
        JOIN orders o
        ON so.id = o.status_id
        JOIN order_detail od
        ON o.id = od.orders_id
        JOIN warehouse w
        ON o.warehouse_id = w.id
        WHERE o.status_id = ?
        GROUP BY od.orders_id
        ORDER BY transaction_date DESC
        LIMIT ? OFFSET ?;
      `
      const [transactionsResult] = await conn.query(sql, [1, parseInt(limit), parseInt(offset)]);

      const dateOptions = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: "true"};

      for (let i = 0; i < transactionsResult.length; i++) {
          transactionsResult[i].transaction_amount = parseInt(transactionsResult[i].transaction_amount);
          transactionsResult[i].shipping_fee = parseInt(transactionsResult[i].shipping_fee);
          transactionsResult[i].transaction_date = transactionsResult[i].transaction_date.toLocaleString('id-ID', dateOptions);
      };

      sql = `
        SELECT COUNT(o.id) AS orders_total FROM orders AS o
        JOIN status_order so
        ON o.status_id = so.id
        WHERE o.status_id = ?;
      `;
      let [ordersTotal] = await conn.query(sql, 1);
      res.set("x-total-count", ordersTotal[0].orders_total);

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
    const { page, limit } = req.query; // Dari frontend
    let offset = page * limit; // Utk slice data, start data drimana

    try {
      let sql = `
        SELECT o.id, o.status_id, so.status, SUM(od.price) AS transaction_amount, IFNULL(o.shipping_fee, 0) AS shipping_fee, o.warehouse_id, w.name AS warehouse_name, o.payment_proof, o.create_on AS transaction_date FROM status_order AS so
        JOIN orders o
        ON so.id = o.status_id
        JOIN order_detail od
        ON o.id = od.orders_id
        JOIN warehouse w
        ON o.warehouse_id = w.id
        WHERE o.status_id = ?
        GROUP BY od.orders_id
        ORDER BY transaction_date DESC
        LIMIT ? OFFSET ?;
      `
      const [transactionsResult] = await conn.query(sql, [2, parseInt(limit), parseInt(offset)]);

      const dateOptions = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: "true"};

      for (let i = 0; i < transactionsResult.length; i++) {
          transactionsResult[i].transaction_amount = parseInt(transactionsResult[i].transaction_amount);
          transactionsResult[i].shipping_fee = parseInt(transactionsResult[i].shipping_fee);
          transactionsResult[i].transaction_date = transactionsResult[i].transaction_date.toLocaleString('id-ID', dateOptions);
      };

      sql = `
        SELECT COUNT(o.id) AS orders_total FROM orders AS o
        JOIN status_order so
        ON o.status_id = so.id
        WHERE o.status_id = ?;
      `;
      let [ordersTotal] = await conn.query(sql, 2);
      res.set("x-total-count", ordersTotal[0].orders_total);

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
    const { page, limit } = req.query; // Dari frontend
    let offset = page * limit; // Utk slice data, start data drimana

    try {
      let sql = `
        SELECT o.id, o.status_id, so.status, SUM(od.price) AS transaction_amount, IFNULL(o.shipping_fee, 0) AS shipping_fee, o.warehouse_id, w.name AS warehouse_name, o.payment_proof, o.create_on AS transaction_date FROM status_order AS so
        JOIN orders o
        ON so.id = o.status_id
        JOIN order_detail od
        ON o.id = od.orders_id
        JOIN warehouse w
        ON o.warehouse_id = w.id
        WHERE o.status_id = ?
        GROUP BY od.orders_id
        ORDER BY transaction_date DESC
        LIMIT ? OFFSET ?;
      `
      const [transactionsResult] = await conn.query(sql, [3, parseInt(limit), parseInt(offset)]);

      const dateOptions = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: "true"};

      for (let i = 0; i < transactionsResult.length; i++) {
          transactionsResult[i].transaction_amount = parseInt(transactionsResult[i].transaction_amount);
          transactionsResult[i].shipping_fee = parseInt(transactionsResult[i].shipping_fee);
          transactionsResult[i].transaction_date = transactionsResult[i].transaction_date.toLocaleString('id-ID', dateOptions);
      };

      sql = `
        SELECT COUNT(o.id) AS orders_total FROM orders AS o
        JOIN status_order so
        ON o.status_id = so.id
        WHERE o.status_id = ?;
      `;
      let [ordersTotal] = await conn.query(sql, 3);
      res.set("x-total-count", ordersTotal[0].orders_total);

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
    const { page, limit } = req.query; // Dari frontend
    let offset = page * limit; // Utk slice data, start data drimana

    try {
      let sql = `
        SELECT o.id, o.status_id, so.status, SUM(od.price) AS transaction_amount, IFNULL(o.shipping_fee, 0) AS shipping_fee, o.warehouse_id, w.name AS warehouse_name, o.payment_proof, o.create_on AS transaction_date FROM status_order AS so
        JOIN orders o
        ON so.id = o.status_id
        JOIN order_detail od
        ON o.id = od.orders_id
        JOIN warehouse w
        ON o.warehouse_id = w.id
        WHERE o.status_id = ?
        GROUP BY od.orders_id
        ORDER BY transaction_date DESC
        LIMIT ? OFFSET ?;
      `
      const [transactionsResult] = await conn.query(sql, [4, parseInt(limit), parseInt(offset)]);

      const dateOptions = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: "true"};

      for (let i = 0; i < transactionsResult.length; i++) {
          transactionsResult[i].transaction_amount = parseInt(transactionsResult[i].transaction_amount);
          transactionsResult[i].shipping_fee = parseInt(transactionsResult[i].shipping_fee);
          transactionsResult[i].transaction_date = transactionsResult[i].transaction_date.toLocaleString('id-ID', dateOptions);
      };

      sql = `
        SELECT COUNT(o.id) AS orders_total FROM orders AS o
        JOIN status_order so
        ON o.status_id = so.id
        WHERE o.status_id = ?;
      `;
      let [ordersTotal] = await conn.query(sql, 4);
      res.set("x-total-count", ordersTotal[0].orders_total);

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
    const { page, limit } = req.query; // Dari frontend
    let offset = page * limit; // Utk slice data, start data drimana

    try {
      let sql = `
        SELECT o.id, o.status_id, so.status, SUM(od.price) AS transaction_amount, IFNULL(o.shipping_fee, 0) AS shipping_fee, o.warehouse_id, w.name AS warehouse_name, o.payment_proof, o.create_on AS transaction_date FROM status_order AS so
        JOIN orders o
        ON so.id = o.status_id
        JOIN order_detail od
        ON o.id = od.orders_id
        JOIN warehouse w
        ON o.warehouse_id = w.id
        WHERE o.status_id = ?
        GROUP BY od.orders_id
        ORDER BY transaction_date DESC
        LIMIT ? OFFSET ?;
      `
      const [transactionsResult] = await conn.query(sql, [5, parseInt(limit), parseInt(offset)]);

      const dateOptions = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: "true"};

      for (let i = 0; i < transactionsResult.length; i++) {
          transactionsResult[i].transaction_amount = parseInt(transactionsResult[i].transaction_amount);
          transactionsResult[i].shipping_fee = parseInt(transactionsResult[i].shipping_fee);
          transactionsResult[i].transaction_date = transactionsResult[i].transaction_date.toLocaleString('id-ID', dateOptions);
      };

      sql = `
        SELECT COUNT(o.id) AS orders_total FROM orders AS o
        JOIN status_order so
        ON o.status_id = so.id
        WHERE o.status_id = ?;
      `;
      let [ordersTotal] = await conn.query(sql, 5);
      res.set("x-total-count", ordersTotal[0].orders_total);

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
    const { page, limit } = req.query; // Dari frontend
    let offset = page * limit; // Utk slice data, start data drimana

    try {
      let sql = `
        SELECT o.id, o.status_id, so.status, SUM(od.price) AS transaction_amount, IFNULL(o.shipping_fee, 0) AS shipping_fee, o.warehouse_id, w.name AS warehouse_name, o.payment_proof, o.create_on AS transaction_date FROM status_order AS so
        JOIN orders o
        ON so.id = o.status_id
        JOIN order_detail od
        ON o.id = od.orders_id
        JOIN warehouse w
        ON o.warehouse_id = w.id
        WHERE o.status_id = ? OR o.status_id = ?
        GROUP BY od.orders_id
        ORDER BY transaction_date DESC
        LIMIT ? OFFSET ?;
      `
      const [transactionsResult] = await conn.query(sql, [6, 7, parseInt(limit), parseInt(offset)]);

      const dateOptions = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: "true"};

      for (let i = 0; i < transactionsResult.length; i++) {
          transactionsResult[i].transaction_amount = parseInt(transactionsResult[i].transaction_amount);
          transactionsResult[i].shipping_fee = parseInt(transactionsResult[i].shipping_fee);
          transactionsResult[i].transaction_date = transactionsResult[i].transaction_date.toLocaleString('id-ID', dateOptions);
      };

      sql = `
        SELECT COUNT(o.id) AS orders_total FROM orders AS o
        JOIN status_order so
        ON o.status_id = so.id
        WHERE o.status_id = ? OR o.status_id = ?;
      `;
      let [ordersTotal] = await conn.query(sql, [6, 7]);
      res.set("x-total-count", ordersTotal[0].orders_total);

      conn.release();
      return res.status(200).send(transactionsResult);
      } catch (error) {
          conn.release();
          console.log(error);
          return res.status(500).send({ message: error.message || "Server error" });
      }
  },
  getTransactionDetail: async (req, res) => {
    console.log("Jalan /transaction/detail");
    const conn = await connection.promise().getConnection();
    const { whid, id } = req.query; // Dari frontend

    try {
      let sql = `
        SELECT o.id AS order_id, od.product_id, p.name AS product_name, od.qty, IFNULL(st.total_stock, 0) AS total_stock, IF(st.total_stock >= od.qty, "Sufficient", "Insufficient") AS stock_status, p.price AS product_price, od.qty * p.price AS total_price FROM status_order AS so
        JOIN orders o
        ON so.id = o.status_id
        JOIN order_detail od
        ON o.id = od.orders_id
        JOIN product p
        ON od.product_id = p.id
        LEFT JOIN (SELECT product_id, IFNULL(SUM(stock), 0) AS total_stock FROM stock 
        WHERE warehouse_id = ?
        GROUP BY product_id) AS st
        ON st.product_id = od.product_id
        WHERE o.id = ?
        GROUP BY od.product_id
        ORDER BY od.product_id;
      `
      const [transactionDetailResult] = await conn.query(sql, [parseInt(whid), parseInt(id)]);

      conn.release();
      return res.status(200).send(transactionDetailResult);
      } catch (error) {
          conn.release();
          console.log(error);
          return res.status(500).send({ message: error.message || "Server error" });
      }
  },
  getShippingInfo: async (req, res) => {
    console.log("Jalan /transaction/detail-shipping");
    const conn = await connection.promise().getConnection();
    const { id } = req.query; // Dari frontend

    try {
      let sql = `
        SELECT a.recipient, a.address, a.phone_number, u.email, b.name AS bank_name, b.account_number, o.courier FROM bank AS b
        JOIN orders o
        ON b.id = o.bank_id
        JOIN user u
        ON o.user_id = u.id
        JOIN address a
        ON u.id = a.user_id
        WHERE o.id = ? AND a.is_main_address = ?;
      `
      const [shippingInfoResult] = await conn.query(sql, [parseInt(id), 1]);

      conn.release();
      return res.status(200).send(shippingInfoResult[0]);
      } catch (error) {
          conn.release();
          console.log(error);
          return res.status(500).send({ message: error.message || "Server error" });
      }
  },
  confirmTransactionPay: async (req, res) => {
    console.log("Jalan /transaction/confirm-payment");
    const conn = await connection.promise().getConnection();
    const { transactionId } = req.params; // Dari frontend

    try {
      await conn.beginTransaction(); // Aktivasi table tidak permanen agar bisa rollback/commit permanent

      let sql = `
        UPDATE orders SET status_id = ?
        WHERE id = ?;
      `
      const [transactionResult] = await conn.query(sql, [3, parseInt(transactionId)]);

      await conn.commit(); // Commit permanent data diupload ke MySql klo berhasil
      conn.release();
      return res.status(200).send({ message: "Transaction accepted" });
      } catch (error) {
          await conn.rollback(); // Rollback data klo terjadi error/gagal
          conn.release();
          console.log(error);
          return res.status(500).send({ message: error.message || "Server error" });
      }
  },
  confirmTransactionDelivery: async (req, res) => {
    console.log("Jalan /transaction/confirm-delivery");
    const conn = await connection.promise().getConnection();
    const { transactionId } = req.params; // Dari frontend

    try {
      await conn.beginTransaction(); // Aktivasi table tidak permanen agar bisa rollback/commit permanent

      let sql = `
        UPDATE orders SET status_id = ?
        WHERE id = ?;
      `
      const [transactionResult] = await conn.query(sql, [4, parseInt(transactionId)]);

      await conn.commit(); // Commit permanent data diupload ke MySql klo berhasil
      conn.release();
      return res.status(200).send({ message: "Transaction accepted" });
      } catch (error) {
          await conn.rollback(); // Rollback data klo terjadi error/gagal
          conn.release();
          console.log(error);
          return res.status(500).send({ message: error.message || "Server error" });
      }
  },
};
