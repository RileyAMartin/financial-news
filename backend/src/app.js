import express from "express";
import config from "./config/config.js";

const app = express();

app.get("/", (req, res) => {
  res.send("Hello world!");
});

app.listen(config.port, () => {
  console.log(`Server listening on port ${config.port}`);
});
