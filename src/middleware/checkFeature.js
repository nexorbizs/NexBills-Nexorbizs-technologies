import prisma from "../config/prisma.js";
import PLAN_FEATURES from "../config/planFeatures.js";

const checkFeature = (featureKey) => async (req, res, next) => {
  try {
    const companyId = req.companyId;

    const subscription = await prisma.subscription.findFirst({
      where: { companyId },
      orderBy: { createdAt: "desc" }
    });

    const plan = subscription?.plan || "basic";
    const access = PLAN_FEATURES[plan] || PLAN_FEATURES["basic"];

    

    if (!access[featureKey]) {
      return res.status(403).json({
        message: `This feature is not available in your ${plan} plan. Please upgrade.`,
        feature: featureKey,
        currentPlan: plan,
      });
    }

    req.plan = plan;
    next();
  } catch (err) {
    console.error("checkFeature error:", err);
    return res.status(500).json({ message: "Server error in feature check" });
  }
};
export default checkFeature;