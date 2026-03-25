import express from "express";
import {
  getUsers,
  createUser,
  toggleUser,
  deleteUser,
  staffLogin,
  updateUserBranches
} from "../controllers/userController.js";
import { authMiddleware, requireRole } from "../middleware/authMiddleware.js";
import checkFeature from "../middleware/checkFeature.js";
import { checkUserLimit } from "../middleware/checkLimit.js";

const router = express.Router();

// STAFF LOGIN (no auth needed)
router.post("/login", staffLogin);

// OWNER ONLY ROUTES
router.get("/", authMiddleware, requireRole("OWNER"), checkFeature("staff_role_management"), getUsers);
router.post("/", authMiddleware, requireRole("OWNER"), checkUserLimit, createUser);
router.put("/:id/branches", authMiddleware, requireRole("OWNER"), checkFeature("staff_role_management"), updateUserBranches);
router.put("/:id/toggle", authMiddleware, requireRole("OWNER"), checkFeature("staff_role_management"), toggleUser);
router.delete("/:id", authMiddleware, requireRole("OWNER"), checkFeature("staff_role_management"), deleteUser);

export default router;