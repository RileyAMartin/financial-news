import express from "express";
import { newsController } from "../controllers/newsController.js";
import { validateCountryCode } from "../middleware/validateCountryCode.js";
import { validateDateRange } from "../middleware/validateDateRange.js";
import { validatePagination } from "../middleware/validatePagination.js";

const router = express.Router();

// GET /api/news/:countryCode?page=1&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get(
  "/:countryCode",
  validateCountryCode,
  validateDateRange,
  validatePagination,
  newsController.getCountryNewsFeed
);

export default router;
