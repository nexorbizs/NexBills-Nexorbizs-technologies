import express from "express";
import {
  getSubscription,
  setSubscription,
  getAllCompanies,
  suspendSubscription,
  unsuspendSubscription,
  extendSubscription
} from "../controllers/subscriptionController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import PLAN_FEATURES from "../config/planFeatures.js";
import prisma from "../config/prisma.js";

const router = express.Router();

// CLIENT ROUTES
router.get("/", authMiddleware, getSubscription);

// ⭐ NEW - returns current company's plan + features (used by frontend usePlan hook)
router.get("/my-plan", authMiddleware, async (req, res) => {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: { companyId: req.companyId },
    });

    const plan = subscription?.plan || "basic";
    const baseFeatures = PLAN_FEATURES[plan] || PLAN_FEATURES["basic"];

    const features = {
      ...baseFeatures,
      maxUsers: subscription?.maxUsers ?? baseFeatures.maxUsers,
      maxBranches: subscription?.maxBranches ?? baseFeatures.maxBranches,
    };

    res.json({ plan, features, status: subscription?.status || "active" });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch plan" });
  }
});

// ADMIN ROUTES (no auth middleware - uses secret instead)
router.post("/set", setSubscription);
router.get("/companies", getAllCompanies);
router.post("/suspend", suspendSubscription);
router.post("/unsuspend", unsuspendSubscription);
router.post("/extend", extendSubscription);

export default router;