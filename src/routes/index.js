const profileRoute = require("./ProfileRoute");

module.exports = {
  profileRoute,
  authRoutes: require("./AuthRoutes"),
  productRoute: require("./ProductRoute"),
  adminRoute: require("./AdminRoute"),
  warehouseRoute: require("./WarehouseRoute"),
  userRoutes: require("./UserRoutes"),
};
