import express from "express";
import {
  getBranches,
  createBranch,
  updateBranch,
  deleteBranch,
  branchDashboard
} from "../controllers/branchController.js";
import { authMiddleware, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, getBranches);
router.get("/dashboard", authMiddleware, branchDashboard);
router.post("/", authMiddleware, requireRole("OWNER"), createBranch);
router.put("/:id", authMiddleware, requireRole("OWNER"), updateBranch);
router.delete("/:id", authMiddleware, requireRole("OWNER"), deleteBranch);

export default router;