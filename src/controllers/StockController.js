const { connection } = require("../connection");
const geolib = require("geolib");

module.exports = {
  getWarehouseNearest: async (req, res) => {
    const connDb = await connection.promise().getConnection();

    try {
      let sql = `select warehouse_id from orders where id = ?`;
      let [warehouseId] = await connDb.query(sql, req.query.orderId);

      sql = `select id, name, address, latitude, longitude from warehouse where id = ?`;
      let [warehouseDestination] = await connDb.query(
        sql,
        warehouseId[0].warehouse_id
      );

      sql = `select warehouse_id, w.name, w.address, IFNULL(total_stock, 0) as stocks, latitude, longitude, 0 as request_qty from warehouse w
        join (select sum(stock) as total_stock, warehouse_id from stock
        where product_id = ?
        group by warehouse_id) s
        on s.warehouse_id = w.id
        where not id = ?`;
      let [listWarehouse] = await connDb.query(sql, [
        req.query.productId,
        warehouseId[0].warehouse_id,
      ]);

      let nearestWarehouse = geolib.orderByDistance(
        warehouseDestination[0],
        listWarehouse
      );

      connDb.release();

      return res.status(200).send({
        origin: nearestWarehouse,
        destination: warehouseDestination[0],
      });
    } catch (error) {
      connDb.release();
      return res.status(500).send({ message: error.message });
    }
  },

  requestStock: async (req, res) => {
    const connDb = await connection.promise().getConnection();
    let data = req.body;

    try {
      for (let i = 0; i < data.origin.length; i++) {
        const dataRequest = {
          orders_id: data.ordersId,
          product_id: data.productId,
          warehouse_origin: data.origin[i].warehouse_id,
          warehouse_destination: data.destination,
          qty: data.origin[i].request_qty,
        };

        let sql = `insert into log_request set ?`;
        await connDb.query(sql, dataRequest);
      }

      connDb.release();

      return res.status(200).send({ message: "Berhasil request" });
    } catch (error) {
      connDb.release();
      console.log(error);
      return res.status(500).send({ message: error.message });
    }
  },

  getOngoingRequest: async (req, res) => {
    const connDb = connection.promise();

    try {
      let sql = `select lr.id, p.name, warehouse_origin, warehouse_destination, qty from log_request lr
      join product p
      on p.id = lr.product_id
      where warehouse_destination = ? and status_id = 1 `;
      let [dataOngoing] = await connDb.query(sql, req.params.warehouseId);

      return res.status(200).send(dataOngoing);
    } catch (error) {
      return res.status(500).send({ message: error.message });
    }
  },
};
