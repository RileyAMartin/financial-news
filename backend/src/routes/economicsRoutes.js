import express from "express";
import { economicsController } from "../controllers/economicsController.js";
import { validateCountryCode } from "../middleware/validateCountryCode.js";
import { validateDateRange } from "../middleware/validateDateRange.js";

const router = express.Router();

// GET /api/economics/:countryCode?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&currencyCode=USD&frequency=Q
// Note: data defaults to quarterly grain and is labeled via dim_date.year_quarter.
router.get(
    "/:countryCode",
    validateCountryCode,
    validateDateRange(true),
    economicsController.getCountryDashboard
);

export default router;