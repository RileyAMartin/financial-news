const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || "production",
  db: {
    url: process.env.DB_URL,
    cert: process.env.DB_CERT,
  },
};

if (!config.db.url || !config.db.cert) {
  throw new Error(
    "Database configuration is missing. Please set DB_URL and DB_CERT in the environment variables."
  );
}

export default config;
