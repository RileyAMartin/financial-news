import express from "express";
import { economicsController } from "../controllers/economicsController.js";
import { validateCountryCode } from "../middleware/validateCountryCode.js";
import { validateOptionalTargetCurrencyCode } from "../middleware/validateCurrencyCode.js";
import { validateDateRange } from "../middleware/validateDateRange.js";
import { validateFrequency } from "../middleware/validateFrequency.js";

const router = express.Router();

// GET /api/economics/:countryCode?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&targetCurrencyCode=USD&frequency=Q
// Note: data defaults to quarterly grain
router.get(
  "/:countryCode",
  validateCountryCode,
  validateOptionalTargetCurrencyCode,
  validateDateRange,
  validateFrequency,
  economicsController.getCountryDashboard
);

export default router;
