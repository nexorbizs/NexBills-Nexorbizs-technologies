import express from "express";
import {
  getSubscription,
  setSubscription,
  getAllCompanies,
  suspendSubscription
} from "../controllers/subscriptionController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// ⭐ CLIENT ROUTES
router.get("/", authMiddleware, getSubscription);

// ⭐ ADMIN ROUTES (no auth middleware - uses secret instead)
router.post("/set", setSubscription);
router.get("/companies", getAllCompanies);
router.post("/suspend", suspendSubscription);

export default router;