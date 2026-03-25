import express from "express";
import {
  getBranches,
  createBranch,
  updateBranch,
  deleteBranch,
  branchDashboard
} from "../controllers/branchController.js";
import { authMiddleware, requireRole } from "../middleware/authMiddleware.js";
import checkFeature from "../middleware/checkFeature.js";
import { checkBranchLimit } from "../middleware/checkLimit.js";

const router = express.Router();

router.get("/", authMiddleware, checkFeature("multi_branch"), getBranches);
router.get("/dashboard", authMiddleware, checkFeature("multi_branch"), branchDashboard);
router.post("/", authMiddleware, requireRole("OWNER"), checkFeature("multi_branch"), checkBranchLimit, createBranch);
router.put("/:id", authMiddleware, requireRole("OWNER"), checkFeature("multi_branch"), updateBranch);
router.delete("/:id", authMiddleware, requireRole("OWNER"), checkFeature("multi_branch"), deleteBranch);

export default router;