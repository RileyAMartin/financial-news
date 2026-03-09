const { Pool } = require("pg");
const config = require("./env");

const pool = new Pool({
  connectionString: config.db.url,
  ssl: {
    rejectUnauthorized: true,
    ca: config.db.cert,
  },
});

pool.on("error", (err) => {
  console.error("Unexpected error on client", err);
  process.exit(-1);
});

const query = (text, params) => {
  pool.query(text, params);
};

module.exports = { pool, query };
