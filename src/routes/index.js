const profileRoute = require("./ProfileRoute");
const transactionRoute = require("./TransactionRoute");
const locationRoute = require("./LocationRoute");
const historyRoute = require("./HistoryRoute");
const stockRoute = require("./StockRoute");

module.exports = {
  profileRoute,
  authRoutes: require("./AuthRoutes"),
  productRoute: require("./ProductRoute"),
  adminRoute: require("./AdminRoute"),
  warehouseRoute: require("./WarehouseRoute"),
  userRoutes: require("./UserRoutes"),
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
