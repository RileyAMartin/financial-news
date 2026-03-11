import express from "express";
import { economicsController } from "../controllers/economicsController.js";
import { validateCountryCode } from "../middleware/validateCountryCode.js";
import { validateDateRange } from "../middleware/validateDateRange.js";

const router = express.Router();

// GET /api/economics/:countryCode?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
// Note: data is quarterly — period_end_date values are quarter-end dates (Mar 31, Jun 30,
// Sep 30, Dec 31). The date range must span at least one quarter-end to return results.
router.get(
    "/:countryCode",
    validateCountryCode,
    validateDateRange(true),
    economicsController.getCountryDashboard
);

export default router;