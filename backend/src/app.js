import express from "express";
import rateLimit from "express-rate-limit";
import cors from "cors";
import compression from "compression";
import config from "./config/config.js";
import economicsRoutes from "./routes/economicsRoutes.js";
import fxRoutes from "./routes/fxRoutes.js";
import newsRoutes from "./routes/newsRoutes.js";
import dimensionsRoutes from "./routes/dimensionsRoutes.js";
import { AppError } from "./utils/appError.js";
import { RESPONSE_CODES, RESPONSE_MESSAGES } from "./utils/constants.js";

const app = express();

// Compress heavy payloads (like GeoJSON files)
app.use(compression());

const corsOptions = {
  origin: process.env.FRONTEND_URL,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

app.use(express.json());

// Each IP is limited to 500 requests per 15 minutes
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
app.use("/api/fx", fxRoutes);

// 404
app.use("/{*splat}", (req, res, next) => {
  const err = new AppError(
    RESPONSE_MESSAGES.NOT_FOUND,
    RESPONSE_CODES.NOT_FOUND
  );
  next(err);
});

// Global error handler
app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || RESPONSE_CODES.INTERNAL_SERVER_ERROR;
  err.status = err.status || "error";
  err.message =
    err instanceof AppError
      ? err.message
      : RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR;

  const metadata = {
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  };

  if (config.nodeEnv === "development") {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      metadata,
      stack: err.stack,
      error: err,
    });
  } else {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      metadata,
    });
  }
});

export default app;
