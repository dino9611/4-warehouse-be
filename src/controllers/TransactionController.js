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
      console.log(error);
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

      return res.status(200).send({
        data: cart_id,
        ordersId: order.insertId,
        message: "Berhasil checkout",
      });
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
      let sql = `select create_on, bank_id, shipping_fee from orders where id = ?`;
      let [dataOrders] = await connDb.query(sql, req.params.ordersId);

      return res.status(200).send(dataOrders);
    } catch (error) {
      return res.status(500).send({ message: error.message });
    }
  },
};
