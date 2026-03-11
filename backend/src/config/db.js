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

const query = async (text, params) => {
  return pool.query(text, params);
};

export { pool, query };
