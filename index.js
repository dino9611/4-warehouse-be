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
    ], // To put token in headers
  })
);
app.use(bearerToken());
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));

// Import Routes
const {AuthRoutes, productRoute, adminRoute, warehouseRoute} = require("./src/routes");

// Routing
app.use("/auth", AuthRoutes);
// app.use("/user");
app.use("/product", productRoute);
app.use("/admin", adminRoute);
// app.use("/checkout");
// app.use("/payment");
// app.use("/cart");
// app.use("/sales");
// app.use("/order");
app.use("/warehouse", warehouseRoute);

app.listen(PORT, () => console.log(`API running ${PORT}`));