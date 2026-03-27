import express from "express";
import { fxController } from "../controllers/fxController.js";
import { validateFxCurrencyCode } from "../middleware/validateCurrencyCode.js";
import { validateDateRange } from "../middleware/validateDateRange.js";
import { validateFrequency } from "../middleware/validateFrequency.js";

const router = express.Router();

// GET /api/fx?currencyCode=JPY&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&frequency=Q
router.get(
  "/",
  validateFxCurrencyCode,
  validateDateRange(),
  validateFrequency,
  fxController.getFxSeries
);

export default router;
