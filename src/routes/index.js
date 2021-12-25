const profileRoute = require("./ProfileRoute");
const transactionRoute = require("./TransactionRoute");
const locationRoute = require("./LocationRoute");
const historyRoute = require("./HistoryRoute");

module.exports = {
  profileRoute,
  transactionRoute,
  locationRoute,
  historyRoute,
  AuthRoutes: require("./AuthRoutes"),
  productRoute: require("./ProductRoute"),
  adminRoute: require("./AdminRoute"),
  warehouseRoute: require("./WarehouseRoute"),
  salesRoute: require("./SalesRoute")
};