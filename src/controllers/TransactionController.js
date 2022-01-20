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

      sql = `select id, qty from cart_detail where cart_id = ? and product_id = ? and is_deleted = 0`;
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

      if (!dataCart.length) {
        return res.status(200).send(errorStock);
      }

      sql = `select product_id, qty from cart_detail where cart_id = ? and is_deleted = 0`;
      let [dataCartDetail] = await connDb.query(sql, dataCart[0].id);

      for (let i = 0; i < dataCartDetail.length; i++) {
        sql = `select product_id, sum(stock) as total_stock from stock where product_id = ?`;
        let [dataStock] = await connDb.query(sql, dataCartDetail[i].product_id);

        if (dataCartDetail[i].qty > parseInt(dataStock[0]?.total_stock)) {
          errorStock.push(dataCartDetail[i].product_id);
        }
      }

      connDb.release();

      return res.status(200).send(errorStock);
    } catch (error) {
      connDb.release();

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
      let [dataCartDetail] = await connDb.query(sql, [dataCart[0]?.id]);

      connDb.release();

      return res.status(200).send(dataCartDetail);
    } catch (error) {
      connDb.release();

      return res.status(500).send({ message: error.message });
    }
  },

  getTotalItemInCart: async (req, res) => {
    const connDb = await connection.promise().getConnection();

    try {
      let sql = `select id from cart where user_id = ? and is_checkout = 0`;
      let [dataCart] = await connDb.query(sql, [req.params.userId]);

      if (!dataCart.length) {
        return;
      }
      sql = `select sum(qty) as total_item from cart_detail
      where cart_id = ? and is_deleted = 0`;
      let [totalItem] = await connDb.query(sql, dataCart[0].id);

      connDb.release();

      return res.status(200).send(totalItem[0].total_item);
    } catch (error) {
      connDb.release();

      return res.status(500).send({ message: error.message });
    }
  },

  deleteProductInCart: async (req, res) => {
    const connDb = connection.promise();

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
      address_id,
      bank_id,
      warehouse_id,
      courier,
    } = req.body;

    try {
      await connDb.beginTransaction();

      if (
        !user_id &&
        !shipping_fee &&
        !address_id &&
        !bank_id &&
        !warehouse_id
      ) {
        throw { message: "Kolom belum terisi semua" };
      }

      // Update is_checkout pada table cart menjadi 1

      sql = `update cart set is_checkout = 1 where user_id = ? and is_checkout = 0`;
      await connDb.query(sql, [user_id]);

      // Insert data baru ke tabel order

      let dataOrder = {
        user_id,
        shipping_fee,
        address_id,
        bank_id,
        warehouse_id,
        courier,
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

        sql = `select price from product 
        where id = ?`;
        const [priceProduct] = await connDb.query(
          sql,
          dataCartDetail[i].product_id
        );

        const dataOrderDetail = {
          orders_id: order.insertId,
          product_id: dataCartDetail[i].product_id,
          qty: dataCartDetail[i].qty,
          price: priceProduct[0].price,
        };

        sql = `insert into order_detail set ?`;
        await connDb.query(sql, dataOrderDetail);
      }

      connDb.release();

      await connDb.commit();

      return res.status(200).send({
        data: cart_id,
        ordersId: order.insertId,
        message: "Berhasil checkout",
      });
    } catch (error) {
      connDb.release();
      await connDb.rollback();

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

  uploadPaymentProof: async (req, res) => {
    const connDb = await connection.promise().getConnection();

    try {
      const path = "/assets/images/uploaded/payment-proof";

      imagePath = req.files.image
        ? `${path}/${req.files.image[0].filename}`
        : null;

      const dataPaymentProof = {
        status_id: 2,
        payment_proof: imagePath,
      };

      let sql = `update orders set ? where id = ?`;
      await connDb.query(sql, [dataPaymentProof, req.params.ordersId]);

      sql = `select payment_proof from orders where id = ?`;
      let [paymentProof] = await connDb.query(sql, req.params.ordersId);

      return res.status(200).send(paymentProof[0]);
    } catch (error) {
      return res.status(500).send({ message: error.message });
    }
  },

  getDataOrders: async (req, res) => {
    const connDb = connection.promise();

    try {
      let sql = `select o.create_on, b.name, b.account_number, a.phone_number, (od.qty * p.price) as total_price, o.shipping_fee from order_detail od
      join orders o
      on o.id = od.orders_id
      join product p 
      on p.id = od.product_id
      join bank b
      on b.id = o.bank_id
      join address a
      on a.id = o.address_id
      where orders_id = ?`;
      let [dataOrders] = await connDb.query(sql, req.params.ordersId);

      return res.status(200).send(dataOrders);
    } catch (error) {
      return res.status(500).send({ message: error.message });
    }
  },
  getAllTransactions: async (req, res) => {
    console.log("Jalan /transaction/all-transactions");
    const conn = await connection.promise().getConnection();
    const { page, limit, roleid, whid } = req.query; // Dari frontend
    let offset = page * limit; // Utk slice data, start data drimana

    try {
      let sql;
      let queryParameter = [];

      if (parseInt(roleid) === 1) {
        sql = `
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
        `;
        queryParameter = [parseInt(limit), parseInt(offset)];
      } else {
        sql = `
          SELECT o.id, o.status_id, so.status, SUM(od.price) AS transaction_amount, IFNULL(o.shipping_fee, 0) AS shipping_fee, o.warehouse_id, w.name AS warehouse_name, o.payment_proof, o.create_on AS transaction_date FROM status_order AS so
          JOIN orders o
          ON so.id = o.status_id
          JOIN order_detail od
          ON o.id = od.orders_id
          JOIN warehouse w
          ON o.warehouse_id = w.id
          WHERE o.warehouse_id = ?
          GROUP BY od.orders_id
          ORDER BY transaction_date DESC
          LIMIT ? OFFSET ?;
        `;
        queryParameter = [parseInt(whid), parseInt(limit), parseInt(offset)];
      }

      const [transactionsResult] = await conn.query(sql, queryParameter);

      const dateOptions = {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: "true",
      };

      for (let i = 0; i < transactionsResult.length; i++) {
        transactionsResult[i].transaction_amount = parseInt(
          transactionsResult[i].transaction_amount
        );
        transactionsResult[i].shipping_fee = parseInt(
          transactionsResult[i].shipping_fee
        );
        transactionsResult[i].transaction_date = transactionsResult[
          i
        ].transaction_date.toLocaleString("id-ID", dateOptions);
      }

      if (parseInt(roleid) === 1) {
        sql = `SELECT COUNT(id) AS orders_total FROM orders;`;
      } else {
        sql = `SELECT COUNT(id) AS orders_total FROM orders WHERE warehouse_id = ${whid};`;
      }

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
    const { page, limit, roleid, whid } = req.query; // Dari frontend
    let offset = page * limit; // Utk slice data, start data drimana

    try {
      let sql;
      let queryParameter = [];

      if (parseInt(roleid) === 1) {
        sql = `
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
        `;
        queryParameter = [1, parseInt(limit), parseInt(offset)];
      } else {
        sql = `
          SELECT o.id, o.status_id, so.status, SUM(od.price) AS transaction_amount, IFNULL(o.shipping_fee, 0) AS shipping_fee, o.warehouse_id, w.name AS warehouse_name, o.payment_proof, o.create_on AS transaction_date FROM status_order AS so
          JOIN orders o
          ON so.id = o.status_id
          JOIN order_detail od
          ON o.id = od.orders_id
          JOIN warehouse w
          ON o.warehouse_id = w.id
          WHERE o.status_id = ? AND o.warehouse_id = ?
          GROUP BY od.orders_id
          ORDER BY transaction_date DESC
          LIMIT ? OFFSET ?;
        `;
        queryParameter = [1, parseInt(whid), parseInt(limit), parseInt(offset)];
      }

      const [transactionsResult] = await conn.query(sql, queryParameter);

      const dateOptions = {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: "true",
      };

      for (let i = 0; i < transactionsResult.length; i++) {
        transactionsResult[i].transaction_amount = parseInt(
          transactionsResult[i].transaction_amount
        );
        transactionsResult[i].shipping_fee = parseInt(
          transactionsResult[i].shipping_fee
        );
        transactionsResult[i].transaction_date = transactionsResult[
          i
        ].transaction_date.toLocaleString("id-ID", dateOptions);
      }

      if (parseInt(roleid) === 1) {
        sql = `
          SELECT COUNT(o.id) AS orders_total FROM orders AS o
          JOIN status_order so
          ON o.status_id = so.id
          WHERE o.status_id = ?;
        `;
        queryParameter = [1];
      } else {
        sql = `
          SELECT COUNT(o.id) AS orders_total FROM orders AS o
          JOIN status_order so
          ON o.status_id = so.id
          WHERE o.status_id = ? AND o.warehouse_id = ?;
        `;
        queryParameter = [1, parseInt(whid)];
      }

      let [ordersTotal] = await conn.query(sql, queryParameter);
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
    const { page, limit, roleid, whid } = req.query; // Dari frontend
    let offset = page * limit; // Utk slice data, start data drimana

    try {
      let sql;
      let queryParameter = [];

      if (parseInt(roleid) === 1) {
        sql = `
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
        `;
        queryParameter = [2, parseInt(limit), parseInt(offset)];
      } else {
        sql = `
          SELECT o.id, o.status_id, so.status, SUM(od.price) AS transaction_amount, IFNULL(o.shipping_fee, 0) AS shipping_fee, o.warehouse_id, w.name AS warehouse_name, o.payment_proof, o.create_on AS transaction_date FROM status_order AS so
          JOIN orders o
          ON so.id = o.status_id
          JOIN order_detail od
          ON o.id = od.orders_id
          JOIN warehouse w
          ON o.warehouse_id = w.id
          WHERE o.status_id = ? AND o.warehouse_id = ?
          GROUP BY od.orders_id
          ORDER BY transaction_date DESC
          LIMIT ? OFFSET ?;
        `;
        queryParameter = [2, parseInt(whid), parseInt(limit), parseInt(offset)];
      }

      const [transactionsResult] = await conn.query(sql, queryParameter);

      const dateOptions = {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: "false",
      };

      for (let i = 0; i < transactionsResult.length; i++) {
        transactionsResult[i].transaction_amount = parseInt(
          transactionsResult[i].transaction_amount
        );
        transactionsResult[i].shipping_fee = parseInt(
          transactionsResult[i].shipping_fee
        );
        transactionsResult[i].transaction_date = transactionsResult[
          i
        ].transaction_date.toLocaleString("id-ID", dateOptions);
      }

      if (parseInt(roleid) === 1) {
        sql = `
          SELECT COUNT(o.id) AS orders_total FROM orders AS o
          JOIN status_order so
          ON o.status_id = so.id
          WHERE o.status_id = ?;
        `;
        queryParameter = [2];
      } else {
        sql = `
          SELECT COUNT(o.id) AS orders_total FROM orders AS o
          JOIN status_order so
          ON o.status_id = so.id
          WHERE o.status_id = ? AND o.warehouse_id = ?;
        `;
        queryParameter = [2, parseInt(whid)];
      }

      let [ordersTotal] = await conn.query(sql, queryParameter);
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
    const { page, limit, roleid, whid } = req.query; // Dari frontend
    let offset = page * limit; // Utk slice data, start data drimana

    try {
      let sql;
      let queryParameter = [];

      if (parseInt(roleid) === 1) {
        sql = `
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
        `;
        queryParameter = [3, parseInt(limit), parseInt(offset)];
      } else {
        sql = `
          SELECT o.id, o.status_id, so.status, SUM(od.price) AS transaction_amount, IFNULL(o.shipping_fee, 0) AS shipping_fee, o.warehouse_id, w.name AS warehouse_name, o.payment_proof, o.create_on AS transaction_date FROM status_order AS so
          JOIN orders o
          ON so.id = o.status_id
          JOIN order_detail od
          ON o.id = od.orders_id
          JOIN warehouse w
          ON o.warehouse_id = w.id
          WHERE o.status_id = ? AND o.warehouse_id = ?
          GROUP BY od.orders_id
          ORDER BY transaction_date DESC
          LIMIT ? OFFSET ?;
        `;
        queryParameter = [3, parseInt(whid), parseInt(limit), parseInt(offset)];
      }

      const [transactionsResult] = await conn.query(sql, queryParameter);

      const dateOptions = {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: "true",
      };

      for (let i = 0; i < transactionsResult.length; i++) {
        transactionsResult[i].transaction_amount = parseInt(
          transactionsResult[i].transaction_amount
        );
        transactionsResult[i].shipping_fee = parseInt(
          transactionsResult[i].shipping_fee
        );
        transactionsResult[i].transaction_date = transactionsResult[
          i
        ].transaction_date.toLocaleString("id-ID", dateOptions);
      }

      if (parseInt(roleid) === 1) {
        sql = `
          SELECT COUNT(o.id) AS orders_total FROM orders AS o
          JOIN status_order so
          ON o.status_id = so.id
          WHERE o.status_id = ?;
        `;
        queryParameter = [3];
      } else {
        sql = `
          SELECT COUNT(o.id) AS orders_total FROM orders AS o
          JOIN status_order so
          ON o.status_id = so.id
          WHERE o.status_id = ? AND o.warehouse_id = ?;
        `;
        queryParameter = [3, parseInt(whid)];
      }

      let [ordersTotal] = await conn.query(sql, queryParameter);
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
    const { page, limit, roleid, whid } = req.query; // Dari frontend
    let offset = page * limit; // Utk slice data, start data drimana

    try {
      let sql;
      let queryParameter = [];

      if (parseInt(roleid) === 1) {
        sql = `
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
        `;
        queryParameter = [4, parseInt(limit), parseInt(offset)];
      } else {
        sql = `
          SELECT o.id, o.status_id, so.status, SUM(od.price) AS transaction_amount, IFNULL(o.shipping_fee, 0) AS shipping_fee, o.warehouse_id, w.name AS warehouse_name, o.payment_proof, o.create_on AS transaction_date FROM status_order AS so
          JOIN orders o
          ON so.id = o.status_id
          JOIN order_detail od
          ON o.id = od.orders_id
          JOIN warehouse w
          ON o.warehouse_id = w.id
          WHERE o.status_id = ? AND o.warehouse_id = ?
          GROUP BY od.orders_id
          ORDER BY transaction_date DESC
          LIMIT ? OFFSET ?;
        `;
        queryParameter = [4, parseInt(whid), parseInt(limit), parseInt(offset)];
      }

      const [transactionsResult] = await conn.query(sql, queryParameter);

      const dateOptions = {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: "true",
      };

      for (let i = 0; i < transactionsResult.length; i++) {
        transactionsResult[i].transaction_amount = parseInt(
          transactionsResult[i].transaction_amount
        );
        transactionsResult[i].shipping_fee = parseInt(
          transactionsResult[i].shipping_fee
        );
        transactionsResult[i].transaction_date = transactionsResult[
          i
        ].transaction_date.toLocaleString("id-ID", dateOptions);
      }

      if (parseInt(roleid) === 1) {
        sql = `
          SELECT COUNT(o.id) AS orders_total FROM orders AS o
          JOIN status_order so
          ON o.status_id = so.id
          WHERE o.status_id = ?;
        `;
        queryParameter = [4];
      } else {
        sql = `
          SELECT COUNT(o.id) AS orders_total FROM orders AS o
          JOIN status_order so
          ON o.status_id = so.id
          WHERE o.status_id = ? AND o.warehouse_id = ?;
        `;
        queryParameter = [4, parseInt(whid)];
      }

      let [ordersTotal] = await conn.query(sql, queryParameter);
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
    const { page, limit, roleid, whid } = req.query; // Dari frontend
    let offset = page * limit; // Utk slice data, start data drimana

    try {
      let sql;
      let queryParameter = [];

      if (parseInt(roleid) === 1) {
        sql = `
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
        `;
        queryParameter = [5, parseInt(limit), parseInt(offset)];
      } else {
        sql = `
          SELECT o.id, o.status_id, so.status, SUM(od.price) AS transaction_amount, IFNULL(o.shipping_fee, 0) AS shipping_fee, o.warehouse_id, w.name AS warehouse_name, o.payment_proof, o.create_on AS transaction_date FROM status_order AS so
          JOIN orders o
          ON so.id = o.status_id
          JOIN order_detail od
          ON o.id = od.orders_id
          JOIN warehouse w
          ON o.warehouse_id = w.id
          WHERE o.status_id = ? AND o.warehouse_id = ?
          GROUP BY od.orders_id
          ORDER BY transaction_date DESC
          LIMIT ? OFFSET ?;
        `;
        queryParameter = [5, parseInt(whid), parseInt(limit), parseInt(offset)];
      }

      const [transactionsResult] = await conn.query(sql, queryParameter);

      const dateOptions = {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: "true",
      };

      for (let i = 0; i < transactionsResult.length; i++) {
        transactionsResult[i].transaction_amount = parseInt(
          transactionsResult[i].transaction_amount
        );
        transactionsResult[i].shipping_fee = parseInt(
          transactionsResult[i].shipping_fee
        );
        transactionsResult[i].transaction_date = transactionsResult[
          i
        ].transaction_date.toLocaleString("id-ID", dateOptions);
      }

      if (parseInt(roleid) === 1) {
        sql = `
          SELECT COUNT(o.id) AS orders_total FROM orders AS o
          JOIN status_order so
          ON o.status_id = so.id
          WHERE o.status_id = ?;
        `;
        queryParameter = [5];
      } else {
        sql = `
          SELECT COUNT(o.id) AS orders_total FROM orders AS o
          JOIN status_order so
          ON o.status_id = so.id
          WHERE o.status_id = ? AND o.warehouse_id = ?;
        `;
        queryParameter = [5, parseInt(whid)];
      }

      let [ordersTotal] = await conn.query(sql, queryParameter);
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
    const { page, limit, roleid, whid } = req.query; // Dari frontend
    let offset = page * limit; // Utk slice data, start data drimana

    try {
      let sql;
      let queryParameter = [];

      if (parseInt(roleid) === 1) {
        sql = `
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
        `;
        queryParameter = [6, 7, parseInt(limit), parseInt(offset)];
      } else {
        sql = `
          SELECT o.id, o.status_id, so.status, SUM(od.price) AS transaction_amount, IFNULL(o.shipping_fee, 0) AS shipping_fee, o.warehouse_id, w.name AS warehouse_name, o.payment_proof, o.create_on AS transaction_date FROM status_order AS so
          JOIN orders o
          ON so.id = o.status_id
          JOIN order_detail od
          ON o.id = od.orders_id
          JOIN warehouse w
          ON o.warehouse_id = w.id
          WHERE o.status_id IN(?, ?) AND o.warehouse_id = ?
          GROUP BY od.orders_id
          ORDER BY transaction_date DESC
          LIMIT ? OFFSET ?;
        `;
        queryParameter = [
          6,
          7,
          parseInt(whid),
          parseInt(limit),
          parseInt(offset),
        ];
      }

      const [transactionsResult] = await conn.query(sql, queryParameter);

      const dateOptions = {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: "true",
      };

      for (let i = 0; i < transactionsResult.length; i++) {
        transactionsResult[i].transaction_amount = parseInt(
          transactionsResult[i].transaction_amount
        );
        transactionsResult[i].shipping_fee = parseInt(
          transactionsResult[i].shipping_fee
        );
        transactionsResult[i].transaction_date = transactionsResult[
          i
        ].transaction_date.toLocaleString("id-ID", dateOptions);
      }

      if (parseInt(roleid) === 1) {
        sql = `
          SELECT COUNT(o.id) AS orders_total FROM orders AS o
          JOIN status_order so
          ON o.status_id = so.id
          WHERE o.status_id = ? OR o.status_id = ?;
        `;
        queryParameter = [6, 7];
      } else {
        sql = `
          SELECT COUNT(o.id) AS orders_total FROM orders AS o
          JOIN status_order so
          ON o.status_id = so.id
          WHERE o.status_id = ? OR o.status_id = ? AND o.warehouse_id = ?;
        `;
        queryParameter = [6, 7, parseInt(whid)];
      }

      let [ordersTotal] = await conn.query(sql, queryParameter);
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
        SELECT o.id AS order_id, o.status_id, od.product_id, p.name AS product_name, od.qty, IFNULL(st.total_stock, 0) AS total_stock, IF(st.total_stock >= od.qty, "Sufficient", "Insufficient") AS stock_status, p.price AS product_price, od.qty * p.price AS total_price FROM status_order AS so
        JOIN orders o
        ON so.id = o.status_id
        JOIN order_detail od
        ON o.id = od.orders_id
        JOIN product p
        ON od.product_id = p.id
        LEFT JOIN (SELECT product_id, IFNULL(SUM(stock), 0) AS total_stock FROM stock 
        WHERE warehouse_id = ? AND ready_to_sent = ?
        GROUP BY product_id) AS st
        ON st.product_id = od.product_id
        WHERE o.id = ?
        GROUP BY od.product_id
        ORDER BY od.product_id;
      `;
      const [transactionDetailResult] = await conn.query(sql, [
        parseInt(whid),
        0,
        parseInt(id),
      ]);

      for (let i = 0; i < transactionDetailResult.length; i++) {
        if (transactionDetailResult[i].stock_status === "Sufficient") {
          transactionDetailResult[i].status_request = "Tidak perlu request";
          continue;
        }

        sql = `select sum(qty) as total_qty_req from log_request
        where orders_id = ? and product_id = ? and status_id = 1`;
        let [cekStatus] = await conn.query(sql, [
          transactionDetailResult[i].order_id,
          transactionDetailResult[i].product_id,
        ]);

        if (!cekStatus.length) {
          transactionDetailResult[i].status_request = "Request required";
          continue;
        }

        if (
          parseInt(cekStatus[0].total_qty_req) !==
          parseInt(transactionDetailResult[i].qty) -
            parseInt(transactionDetailResult[i].total_stock)
        ) {
          transactionDetailResult[i].status_request = "Request required";
        } else {
          transactionDetailResult[i].status_request = "Requested";
        }
      }
      console.log(transactionDetailResult);

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
      `;
      const [shippingInfoResult] = await conn.query(sql, [parseInt(id), 1]);

      conn.release();
      return res.status(200).send(shippingInfoResult[0]);
    } catch (error) {
      conn.release();
      console.log(error);
      return res.status(500).send({ message: error.message || "Server error" });
    }
  },
  confirmRejectTransactionPay: async (req, res) => {
    console.log("Jalan /transaction/confirm-payment");
    const conn = await connection.promise().getConnection();
    const { transactionId } = req.params; // Dari frontend
    const { actionIdentifier } = req.body;
    //! Dari frontend actionIdentifier "Accept" = 1 - true, "Reject" = 0 - false

    try {
      await conn.beginTransaction(); // Aktivasi table tidak permanen agar bisa rollback/commit permanent

      let sql = `
        UPDATE orders SET status_id = ?
        WHERE id = ?;
      `;

      let statusIdParams;
      actionIdentifier ? (statusIdParams = 3) : (statusIdParams = 6);

      await conn.query(sql, [statusIdParams, parseInt(transactionId)]);

      let responseMessage = "";
      actionIdentifier
        ? (responseMessage = "Transaction accepted")
        : (responseMessage = "Transaction rejected");

      if (!actionIdentifier) {
        sql = `
          DELETE FROM stock
          WHERE orders_id = ?;
        `;

        await conn.query(sql, parseInt(transactionId));

        await conn.commit();
        conn.release();
        return res.status(200).send({ message: responseMessage });
      }

      await conn.commit(); // Commit permanent data diupload ke MySql klo berhasil
      conn.release();
      return res.status(200).send({ message: responseMessage });
    } catch (error) {
      await conn.rollback(); // Rollback data klo terjadi error/gagal
      conn.release();
      console.log(error);
      return res.status(500).send({ message: error.message || "Server error" });
    }
  },
  confirmRejectTransactionDelivery: async (req, res) => {
    console.log("Jalan /transaction/confirm-delivery");
    const conn = await connection.promise().getConnection();
    const { actionIdentifier, warehouseId, orderId } = req.body; // Dari frontend
    //! Dari frontend actionIdentifier "Accept" = 1 - true, "Reject" = 0 - false

    try {
      await conn.beginTransaction(); // Aktivasi table tidak permanen agar bisa rollback/commit permanent
      let sql;

      if (actionIdentifier) {
        // ? Bila warehouse admin pada frontend klik button "Send"
        sql = `
          SELECT o.id AS order_id, od.product_id, od.qty, IFNULL(st.total_stock, 0) AS total_stock, IF(st.total_stock >= od.qty, "Sufficient", "Insufficient") AS stock_status FROM status_order AS so
          JOIN orders o
          ON so.id = o.status_id
          JOIN order_detail od
          ON o.id = od.orders_id
          JOIN product p
          ON od.product_id = p.id
          LEFT JOIN (SELECT product_id, IFNULL(SUM(stock), 0) AS total_stock FROM stock 
          WHERE warehouse_id = ? AND ready_to_sent = ?
          GROUP BY product_id) AS st
          ON st.product_id = od.product_id
          WHERE o.id = ?
          GROUP BY od.product_id
          ORDER BY od.product_id;
        `;

        const [validationResult] = await conn.query(sql, [
          parseInt(warehouseId),
          0,
          parseInt(orderId),
        ]);

        const isAllSufficient = (currentValue) =>
          currentValue.qty <= currentValue.total_stock;
        const stockCheck = validationResult.every(isAllSufficient);
        // ! Digunakan utk validasi ulang stok stlh klik button "Send", apakah stok cukup/tidak, dikhawatirkan terjadi perubahan stok real-time saat klik button

        if (stockCheck) {
          // * Bila validasi cek stok = true (stok pesanan masih mencukupi)
          sql = `
            UPDATE orders SET status_id = ?
            WHERE id = ?;
          `;

          await conn.query(sql, [4, parseInt(orderId)]);

          sql = `
            UPDATE stock SET ready_to_sent = ?
            WHERE orders_id = ?;
          `; // * Utk membuat akumulasi stok berkurang setelah ready_to_send ganti ke 0, karena barang sudah dikirim

          await conn.query(sql, [0, parseInt(orderId)]);

          await conn.commit(); // Commit permanent data diupload ke MySql klo berhasil
          conn.release();
          return res
            .status(200)
            .send({ message: `Yeay! Order #${orderId} otw to customer` });
        } else {
          // * Bila validasi cek stok = false (stok pesanan tidak mencukupi)
          await conn.commit(); // Commit permanent data diupload ke MySql klo berhasil
          conn.release();
          return res.status(200).send({
            message: `Stock change occurred during confirmation, please re-check stock/request stock`,
          });
        }
      } else {
        // ? Bila warehouse admin pada frontend klik button "Reject"
        sql = `
          UPDATE orders SET status_id = ?
          WHERE id = ?;
        `;

        await conn.query(sql, [6, parseInt(orderId)]);

        sql = `
          DELETE FROM stock
          WHERE orders_id = ?;
        `;

        await conn.query(sql, parseInt(orderId));

        await conn.commit(); // Commit permanent data diupload ke MySql klo berhasil
        conn.release();
        return res.status(200).send({ message: "Transaction rejected" });
      }
    } catch (error) {
      await conn.rollback(); // Rollback data klo terjadi error/gagal
      conn.release();
      console.log(error);
      return res.status(500).send({ message: error.message || "Server error" });
    }
  },
  getTransactionStatuses: async (req, res) => {
    console.log("Jalan /transaction/statuses");
    const conn = await connection.promise().getConnection();

    try {
      let sql = `SELECT id, status FROM status_order;`;

      const [statusesResult] = await conn.query(sql);

      conn.release();
      return res.status(200).send(statusesResult);
    } catch (error) {
      conn.release();
      console.log(error);
      return res.status(500).send({ message: error.message || "Server error" });
    }
  },
  getPaymentProof: async (req, res) => {
    console.log("Jalan /transaction/payment-proof");
    const conn = await connection.promise().getConnection();
    const { orderId } = req.params; // Dari frontend

    try {
      let sql = `SELECT payment_proof FROM orders WHERE id = ?;`;

      const [payProofResult] = await conn.query(sql, orderId);

      conn.release();
      return res.status(200).send(payProofResult[0].payment_proof);
    } catch (error) {
      conn.release();
      console.log(error);
      return res.status(500).send({ message: error.message || "Server error" });
    }
  },
};
