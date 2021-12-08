const mySql = require("mysql2");

const connection = mySql.createPool({
  port: 3306,
  connectionLimit: 10,
  user: process.env.MYSQL_USERNAME,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
});

connection.getConnection((err, conn) => {
  if (err) {
    console.log("Error Connecting : " + err.stack);
    conn.release();
    return;
  }

  console.log("Connected as id " + conn.threadId);
  conn.release();
});

module.exports = connection;
