import express from "express";
import { dimensionsController } from "../controllers/dimensionsController.js";

const router = express.Router();

// GET /api/dimensions/map (large geojson file)
router.get("/map", dimensionsController.getMap);

// GET /api/dimensions/countries
router.get("/countries", dimensionsController.getCountries);

// GET /api/dimensions/indicators
router.get("/indicators", dimensionsController.getIndicators);

// GET /api/dimensions/sources
router.get("/sources", dimensionsController.getSources);

// GET /api/dimensions/currencies
router.get("/currencies", dimensionsController.getCurrencies);

export default router;
