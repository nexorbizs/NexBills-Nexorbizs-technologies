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

    const dbFeatures = subscription?.features || {};
    const features = {
      ...baseFeatures,
      ...dbFeatures, // admin overrides win
      maxUsers: subscription?.maxUsers ?? baseFeatures.maxUsers,
      maxBranches: subscription?.maxBranches ?? baseFeatures.maxBranches,
    };

    res.json({ plan, features, status: subscription?.status || "active" });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch plan" });
  }
});

// ⭐ ADMIN — set feature overrides for a specific company
router.post("/set-features", async (req, res) => {
  try {
    const { companyId, features, secret } = req.body;

    if (secret !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const updated = await prisma.subscription.update({
      where: { companyId: Number(companyId) },
      data: { features },
    });

    res.json({ success: true, features: updated.features });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update features" });
  }
});

// ADMIN ROUTES (no auth middleware - uses secret instead)
router.post("/set", setSubscription);
router.get("/companies", getAllCompanies);
router.post("/suspend", suspendSubscription);
router.post("/unsuspend", unsuspendSubscription);
router.post("/extend", extendSubscription);

export default router;