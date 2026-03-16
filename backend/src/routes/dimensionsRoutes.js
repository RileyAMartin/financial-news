import express from "express";
import { dimensionsController } from "../controllers/dimensionsController.js";

const router = express.Router();

router.get("/countries", dimensionsController.getCountries);
router.get("/indicators", dimensionsController.getIndicators);
router.get("/sources", dimensionsController.getSources);

export default router;
