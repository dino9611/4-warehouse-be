const { connection } = require("../connection");

module.exports = {
  getDataHistory: async (req, res) => {
    const connDb = connection.promise();

    try {
      let sql = `select o.create_on, so.status, p.images, p.price, od.qty, p.name , count(od.orders_id) as total_barang  from orders o
        join order_detail od
        on o.id = od.orders_id
        join product p
        on p.id = od.product_id
        join status_order so
        on so.id = o.status_id
        where user_id = ?
        group by o.id`;
      let [dataOrder] = await connDb.query(sql, req.params.userId);

      return res.status(200).send(dataOrder);
    } catch (error) {
      return res.status(500).send({ message: error.message });
    }
  },
};
