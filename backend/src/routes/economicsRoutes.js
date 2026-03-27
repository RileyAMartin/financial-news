import express from "express";
import { economicsController } from "../controllers/economicsController.js";
import { validateCountryCode } from "../middleware/validateCountryCode.js";
import { validateOptionalEconomicsCurrencyCode } from "../middleware/validateCurrencyCode.js";
import { validateDateRange } from "../middleware/validateDateRange.js";
import { validateFrequency } from "../middleware/validateFrequency.js";

const router = express.Router();

// GET /api/economics/:countryCode?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&currencyCode=USD&frequency=Q
// Note: data defaults to quarterly grain and is labeled via dim_date.year_quarter.
router.get(
    "/:countryCode",
    validateCountryCode,
    validateOptionalEconomicsCurrencyCode,
    validateDateRange(),
    validateFrequency,
    economicsController.getCountryDashboard
);

export default router;