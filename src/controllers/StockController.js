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

      sql = `select warehouse_id, w.name, w.address, IFNULL(total_stock, 0) as stocks, latitude, longitude from warehouse w
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
};
