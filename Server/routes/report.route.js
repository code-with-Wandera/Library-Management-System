import express from "express";
import { getCirculationReport } from "../controllers/report.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js"; 

const router = express.Router();

// All report routes require being logged in
router.use(verifyToken);

// GET /api/reports/circulation
router.get("/circulation", getCirculationReport);

export default router;