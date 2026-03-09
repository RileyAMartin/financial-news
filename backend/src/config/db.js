import { Pool } from "pg";
import config from "./config.js";

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

const text = `
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'defaultdb' -- Replace 'public' with your schema name if needed
AND table_type = 'BASE TABLE';
`;
pool.query("select count(1) from dim_indicators;").then((result) => {
  console.log(result);
});

module.exports = { pool, query };
