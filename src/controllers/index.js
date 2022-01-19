const profileController = require("./ProfileController");
const AuthControllers = require("./AuthControllers");
const productController = require("./ProductController");
const adminController = require("./AdminController");
const warehouseController = require("./WarehouseController");
const userControllers = require("./UserControllers");
// const listProductController = require("./ListProductController");
const salesController = require("./SalesController");
const transactionController = require("./TransactionController");
const locationController = require("./LocationController");
const HistoryController = require("./HistoryController");
const StockController = require("./StockController");

module.exports = {
  profileController,
  adminController,
  AuthControllers,
  productController,
  adminController,
  warehouseController,
  userControllers,
  // listProductController,
  salesController,
  transactionController,
  locationController,
  HistoryController,
  StockController,
};
