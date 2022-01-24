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
        where product_id = ? and ready_to_sent = 0
        group by warehouse_id) s
        on s.warehouse_id = w.id
        where not id = ? `;
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
      console.log(error);
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

        let sql = `select id, qty from log_request
        where orders_id = ? and product_id = ? and warehouse_origin = ? and status_id = 1`;
        let [checkData] = await connDb.query(sql, [
          data.ordersId,
          data.productId,
          data.origin[i].warehouse_id,
        ]);

        if (checkData.length) {
          sql = `select sum(stock) as total_stock, w.name from stock s
          join warehouse w
          on w.id = s.warehouse_id      
          where warehouse_id = ? and product_id = ? and ready_to_sent = 0`;
          const [checkStock] = await connDb.query(sql, [
            data.origin[i].warehouse_id,
            data.productId,
          ]);

          if (checkStock[0].total_stock < checkData[0].qty + dataRequest.qty)
            throw {
              message: `Stock pada ${checkStock[0].name} kurang, anda pernah request ke gudang ini sebelumnya`,
            };

          sql = `update log_request set qty = ? where id = ?`;
          await connDb.query(sql, [
            checkData[0].qty + dataRequest.qty,
            checkData[0].id,
          ]);
        } else {
          sql = `insert into log_request set ?`;
          await connDb.query(sql, dataRequest);
        }
      }

      connDb.release();

      return res.status(200).send({ message: "Berhasil request" });
    } catch (error) {
      connDb.release();
      console.log(error);
      return res.status(500).send({ message: error.message });
    }
  },

  getStockRequest: async (req, res) => {
    const connDb = await connection.promise().getConnection();
    const { origin, statusId, page, limit } = req.query;
    const offset = parseInt(page) * parseInt(limit);

    try {
      let sql = `select lr.id, orders_id, lr.product_id, p.name, warehouse_origin, (select name from warehouse where id = warehouse_origin) as origin, warehouse_destination, (select name from warehouse where id = warehouse_destination) as destination, qty, status_id, sr.status, lr.last_update from log_request lr
      join product p
      on p.id = lr.product_id
      join status_request sr
      on sr.id = lr.status_id
      where warehouse_origin = ? and status_id = ?
      order by lr.last_update desc
      limit ?, ?`;
      let [dataOngoing] = await connDb.query(sql, [
        origin,
        statusId,
        parseInt(offset),
        parseInt(limit),
      ]);

      sql = `select count(id) as total_item from log_request
      where status_id = ? and warehouse_origin = ?`;
      let [totalItem] = await connDb.query(sql, [statusId, origin]);

      res.set("x-total-count", totalItem[0].total_item);

      connDb.release();

      return res.status(200).send(dataOngoing);
    } catch (error) {
      connDb.release();
      console.log(error);
      return res.status(500).send({ message: error.message });
    }
  },

  checkingRequest: async (req, res) => {
    const connDb = await connection.promise();
    const { ordersId, productId } = req.query;

    try {
      let sql = `select sum(qty) as total_qty_req from log_request
      where orders_id = ? and product_id = ? and status_id = 1`;
      let [qtyRequest] = await connDb.query(sql, [ordersId, productId]);

      return res.status(200).send(qtyRequest[0].total_qty_req);
    } catch (error) {
      return res.status(500).send({ message: error.message });
    }
  },

  rejectingRequest: async (req, res) => {
    const connDb = connection.promise();
    const { ordersId, productId, warehouseId } = req.query;

    try {
      if (!ordersId || !productId) {
        throw { message: "Error" };
      }

      let sql = `update log_request set status_id = 2 where orders_id = ? and product_id = ? and warehouse_origin = ? and status_id =1`;
      await connDb.query(sql, [ordersId, productId, warehouseId]);

      return res.status(200).send({ message: "Request Rejected" });
    } catch (error) {
      return res.status(500).send({ message: error.message });
    }
  },

  acceptingRequest: async (req, res) => {
    const connDb = await connection.promise().getConnection();
    const { ordersId, productId, warehouseId } = req.query;
    const { warehouse_id, orders_id, product_id, stock } = req.body;

    try {
      await connDb.beginTransaction();

      let sql = `update log_request set status_id = 3 where orders_id = ? and product_id = ? and warehouse_origin = ? and status_id = 1`;
      await connDb.query(sql, [ordersId, productId, warehouseId]);

      const dataAccept = {
        warehouse_id,
        orders_id,
        product_id,
        stock,
        ready_to_sent: 0,
      };

      sql = `insert into stock set ?`;
      await connDb.query(sql, dataAccept);

      await connDb.commit();

      connDb.release();

      return res.status(200).send({ message: "Berhasil accept request" });
    } catch (error) {
      await connDb.rollback();
      connDb.release();
      return res.status(500).send({ message: error.message });
    }
  },

  logRequest: async (req, res) => {
    const connDb = await connection.promise().getConnection();
    const { statusId, warehouseId, page, limit } = req.query;
    const offset = parseInt(page) * parseInt(limit);

    try {
      let warehouse;

      if (parseInt(statusId) === 0) {
        warehouse = `warehouse_destination = ${connDb.escape(warehouseId)}`;
        console.log("in");
      } else if (parseInt(statusId) === 1) {
        warehouse = `warehouse_origin = ${connDb.escape(warehouseId)}`;
        console.log("out");
      }

      let sql = `select lr.orders_id, p.name, (select name from warehouse where id = warehouse_origin) as origin, (select name from warehouse where id = warehouse_destination) as destination, lr.qty, sr.status, lr.last_update from log_request lr
      join product p 
      on p.id = lr.product_id
      join status_request sr
      on sr.id = lr.status_id
      where ${warehouse} and status_id = 3
      order by lr.last_update desc
      limit ?, ?`;
      let [dataLogRequest] = await connDb.query(sql, [
        parseInt(offset),
        parseInt(limit),
      ]);

      sql = `select count(id) as total_item from log_request
      where ${warehouse} and status_id = 3`;
      let [totalItem] = await connDb.query(sql, [statusId, warehouseId]);

      res.set("x-total-count", totalItem[0].total_item);

      connDb.release();

      return res.status(200).send(dataLogRequest);
    } catch (error) {
      connDb.release();
      return res.status(500).send({ message: error.message });
    }
  },
};
