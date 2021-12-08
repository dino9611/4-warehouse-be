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

app.get("/role", async (req, res) => {
  try {
    const conn = await connection.promise().getConnection();
    const [result] = await conn.query("select * from role");
    conn.release();
    res.send(result);
  } catch (error) {
    console.log(error);
    res.status(500).send(result);
  }
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

// Import Routes
const { AuthRoutes } = require("./src/routes");
const { Console } = require("console");

// Routing
app.use("/auth", AuthRoutes);
// app.use("/user");
// app.use("/product");
// app.use("/checkout");
// app.use("/payment");
// app.use("/cart");
// app.use("/admin");
// app.use("/sales");
// app.use("/order");
// app.use("/warehouse");

app.get("/product/pagination", async (req, res) => {
  console.log("Jalan /product/pagination");
  const conn = await connection.promise().getConnection();
  try {
    let sql = `
        SELECT p.images, p.id, CONCAT(c.category, "-", YEAR(p.create_on), "0", p.id) AS SKU,p.name, c.category, p.price, total_stock FROM product AS p
        JOIN category c
        ON p.category_id = c.id
        JOIN (SELECT product_id, SUM(stock) AS total_stock FROM stock
        WHERE ready_to_sent = 0
        GROUP BY product_id) AS s
        ON s.product_id = p.id
        GROUP BY p.id
        ORDER BY p.id;
      `;
    const [result] = await conn.query(sql, 0);
    // console.log(result);
    conn.release();
    return res.status(200).send(result);
  } catch (error) {
    conn.release();
    console.log(error);
    return res.status(500).send({ message: error.message || "Server error" });
  }
});
app.get("/", (req, res) => {
  res.send("test");
});

app.listen(PORT, () => console.log(`API running ${PORT}`));
