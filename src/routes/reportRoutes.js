import express from "express";
import { dashboardSummary, todaySales, salesReport } from "../controllers/reportController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/dashboard", authMiddleware, dashboardSummary);
router.get("/today", authMiddleware, todaySales);
router.get("/sales", authMiddleware, salesReport);

export default router;