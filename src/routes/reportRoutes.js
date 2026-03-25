import express from "express";
import {
  dashboardSummary,
  todaySales,
  salesReport,
  profitLossReport
} from "../controllers/reportController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import checkFeature from "../middleware/checkFeature.js";

const router = express.Router();

router.get("/dashboard", authMiddleware, dashboardSummary);
router.get("/today", authMiddleware, todaySales);
router.get("/sales", authMiddleware, checkFeature("reports"), salesReport);
router.get("/profit-loss", authMiddleware, checkFeature("profit_loss_report"), profitLossReport);

export default router;