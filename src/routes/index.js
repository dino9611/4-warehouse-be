const profileRoute = require("./ProfileRoute");
const transactionRoute = require("./TransactionRoute");
const locationRoute = require("./LocationRoute");
const historyRoute = require("./HistoryRoute");

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
  AuthRoutes: require("./AuthRoutes"),
  productRoute: require("./ProductRoute"),
  adminRoute: require("./AdminRoute"),
  warehouseRoute: require("./WarehouseRoute"),
  salesRoute: require("./SalesRoute"),
};
