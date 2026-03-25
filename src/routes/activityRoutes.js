import express from "express";
import { getActivityLogs } from "../controllers/activityController.js";
import { authMiddleware, requireRole } from "../middleware/authMiddleware.js";
import checkFeature from "../middleware/checkFeature.js";

const router = express.Router();

// OWNER only
router.get("/", authMiddleware, requireRole("OWNER"), checkFeature("activity_log"), getActivityLogs);

export default router;