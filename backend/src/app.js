import express from "express";
import rateLimit from "express-rate-limit";
import config from "./config/config.js";
import economicsRoutes from "./routes/economicsRoutes.js";
import newsRoutes from "./routes/newsRoutes.js";
import dimensionsRoutes from "./routes/dimensionsRoutes.js";
import { AppError } from "./utils/appError.js";
import { RESPONSE_CODES, RESPONSE_MESSAGES } from "./utils/constants.js";

const app = express();

app.use(express.json());

// Limit each IP to 500 requests per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Routes
app.use("/api/economics", economicsRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/dimensions", dimensionsRoutes);

// 404
app.use("/{*splat}", (req, res, next) => {
  const err = new AppError(RESPONSE_MESSAGES.NOT_FOUND, RESPONSE_CODES.NOT_FOUND);
  next(err);
});

// Global error handler
app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || RESPONSE_CODES.INTERNAL_SERVER_ERROR;
  err.status = err.status || "error";

  if (config.nodeEnv === "development") {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      stack: err.stack,
      error: err,
    });
  } else {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.isOperational ? err.message : RESPONSE_MESSAGES.GENERIC_ERROR,
    });
  }
});

export default app;