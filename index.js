require("dotenv").config();

const express = require("express");
const app = express();
const PORT = process.env.PORT || 5005;
const cors = require("cors");
const bearerToken = require("express-bearer-token");
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");
const { connection } = require("./src/connection");

// Import Routes
const {} = require("./src/routes");

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
    ], // To put token in headers
  })
);
app.use(bearerToken());
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));

// Routing
// app.use("/auth");
// app.use("/user");
// app.use("/product");
// app.use("/checkout");
// app.use("/payment");
// app.use("/cart");
// app.use("/admin");
// app.use("/sales");
// app.use("/order");
// app.use("/warehouse");

app.listen(PORT, () => console.log(`API running ${PORT}`));
