const profileRoute = require("./ProfileRoute");

module.exports = {
  profileRoute,
  AuthRoutes: require("./AuthRoutes"),
  productRoute: require("./ProductRoute"),
  adminRoute: require("./AdminRoute"),
  warehouseRoute: require("./WarehouseRoute"),
};
