const { connection } = require("../connection");

module.exports = {
  getDataHistory: async (req, res) => {
    const connDb = await connection.promise().getConnection();
    const { status, page, limit } = req.query;

    let offset = parseInt(page) * parseInt(limit);

    try {
      let sql = `select o.id as orders_id, o.create_on, so.id as status_id ,so.status, p.images, p.price, od.qty, p.name , count(od.orders_id) as total_barang  from orders o
        join order_detail od
        on o.id = od.orders_id
        join product p
        on p.id = od.product_id
        join status_order so
        on so.id = o.status_id
        where user_id = ? and status_id = ?
        group by o.id
        limit ?,?`;
      let [dataOrder] = await connDb.query(sql, [
        req.params.userId,
        status,
        offset,
        parseInt(limit),
      ]);

      sql = `select count(id) as total_order from orders where user_id = ? and status_id = ?`;
      let [totalOrder] = await connDb.query(sql, [req.params.userId, status]);

      res.set("x-total-order", totalOrder[0].total_order);

      connDb.release();

      return res.status(200).send(dataOrder);
    } catch (error) {
      connDb.release();
      console.log(error);
      return res.status(500).send({ message: error.message });
    }
  },

  getOrderDetail: async (req, res) => {
    const connDb = connection.promise();

    try {
      let sql = `select so.id as status_orderId, o.create_on, o.courier, o.shipping_fee, o.payment_proof, a.recipient, a.address, a.phone_number, r.city, r.province, p.images, p.name as name_prod, p.price, od.qty, b.name  from order_detail od
      join orders o
      on o.id = od.orders_id
      join product p
      on p.id = od.product_id
      join status_order so
      on so.id = o.status_id
      join address a
      on a.id = o.address_id
      join region r
      on r.address_id = a.id
      join bank b
      on b.id = o.bank_id
      where o.id = ?`;
      let [dataOrderDetail] = await connDb.query(sql, req.params.ordersId);

      return res.status(200).send(dataOrderDetail);
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: error.message });
    }
  },

  getStatusOrder: async (req, res) => {
    const connDb = connection.promise();

    try {
      let sql = `select * from status_order`;
      let [statusOrder] = await connDb.query(sql);

      return res.status(200).send(statusOrder);
    } catch (error) {
      return res.status(500).send({ message: error.message });
    }
  },
};
