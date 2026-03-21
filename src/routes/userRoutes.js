import express from "express";
import {
  getUsers,
  createUser,
  toggleUser,
  deleteUser,
  staffLogin
} from "../controllers/userController.js";
import { authMiddleware, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// ⭐ STAFF LOGIN (no auth needed)
router.post("/login", staffLogin);

// ⭐ OWNER ONLY ROUTES
router.get("/", authMiddleware, requireRole("OWNER"), getUsers);
router.post("/", authMiddleware, requireRole("OWNER"), createUser);
router.put("/:id/toggle", authMiddleware, requireRole("OWNER"), toggleUser);
router.delete("/:id", authMiddleware, requireRole("OWNER"), deleteUser);

export default router;