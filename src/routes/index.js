const profileRoute = require("./ProfileRoute");
const transactionRoute = require("./TransactionRoute");
const locationRoute = require("./LocationRoute");
const historyRoute = require("./HistoryRoute");
const stockRoute = require("./StockRoute");

module.exports = {
  profileRoute,
  transactionRoute,
  locationRoute,
  historyRoute,
  stockRoute,
  AuthRoutes: require("./AuthRoutes"),
  productRoute: require("./ProductRoute"),
  adminRoute: require("./AdminRoute"),
  warehouseRoute: require("./WarehouseRoute"),
  salesRoute: require("./SalesRoute"),
};
