import express from "express";
import { getActivityLogs } from "../controllers/activityController.js";
import { authMiddleware, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// OWNER only
router.get("/", authMiddleware, requireRole("OWNER"), getActivityLogs);

export default router;