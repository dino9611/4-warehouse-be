require("dotenv").config();

const express = require("express");
const app = express();
const PORT = process.env.PORT || 5005;
const cors = require("cors");
const { connection } = require("./src/connection");
const morgan = require("morgan");
const path = require("path");
const fs = require("fs");
const bearerToken = require("express-bearer-token");

// Middleware global start
morgan.token("date", (req, res) => {
  return new Date();
});

const accessLogStream = fs.createWriteStream(
  path.join(__dirname, "access.log"),
  {
    flags: "a",
  }
);

// Middleware global start
morgan.token("date", (req, res) => {
  return new Date();
});
// app.use(
//   morgan("method :url :status :res[content-length] - :response-time ms :date"),
//   { stream: accessLogStream }
// );
app.use(express.json());
app.use(
  cors({
    exposedHeaders: [
      "x-token-verify",
      "x-token-access",
      "x-token-refresh",
      "x-total-count",
      "x-token-email",
      "x-total-order",
    ], // To put token in headers
    allowedHeaders: [
      "filter_year",
      "role_id",
      "warehouse_id"
    ]
  })
);
app.use(bearerToken());
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));

// Import Routes
const {
  authRoutes,
  productRoute,
  adminRoute,
  warehouseRoute,
  profileRoute,
  userRoutes,
  salesRoute,
  transactionRoute,
  locationRoute,
  historyRoute,
  stockRoute,
} = require("./src/routes");

// Routing
app.use("/auth", authRoutes);
app.use("/profile", profileRoute);
app.use("/product", productRoute);
app.use("/admin", adminRoute);
app.use("/warehouse", warehouseRoute);
app.use("/user", userRoutes);
app.use("/sales", salesRoute);
app.use("/transaction", transactionRoute);
app.use("/location", locationRoute);
app.use("/history", historyRoute);
app.use("/stock", stockRoute);

app.listen(PORT, () => console.log(`API running ${PORT}`));
