// middleware/checkLimit.js
import prisma from "../config/prisma.js";
import PLAN_FEATURES from "../config/planFeatures.js";

export const checkUserLimit = async (req, res, next) => {
  try {
    const companyId = req.companyId;

    const subscription = await prisma.subscription.findFirst({
      where: { companyId },
    });

    const plan = subscription?.plan || "basic";
    const maxUsers = subscription?.maxUsers ?? PLAN_FEATURES[plan]?.maxUsers ?? 1;

    const currentCount = await prisma.user.count({
      where: { companyId, isActive: true },
    });

    if (maxUsers !== Infinity && currentCount >= maxUsers) {
      return res.status(403).json({
        message: `User limit reached. Your ${plan} plan allows max ${maxUsers} users.`,
        limit: maxUsers,
        current: currentCount,
      });
    }

    next();
  } catch (err) {
    console.error("checkUserLimit error:", err);
    return res.status(500).json({ message: "Server error in limit check" });
  }
};

export const checkBranchLimit = async (req, res, next) => {
  try {
    const companyId = req.companyId;

    const subscription = await prisma.subscription.findFirst({
      where: { companyId },
    });

    const plan = subscription?.plan || "basic";
    const maxBranches = subscription?.maxBranches ?? PLAN_FEATURES[plan]?.maxBranches ?? 1;

    const currentCount = await prisma.branch.count({
      where: { companyId, isActive: true },
    });

    if (maxBranches !== Infinity && currentCount >= maxBranches) {
      return res.status(403).json({
        message: `Branch limit reached. Your ${plan} plan allows max ${maxBranches} branches.`,
        limit: maxBranches,
        current: currentCount,
      });
    }

    next();
  } catch (err) {
    console.error("checkBranchLimit error:", err);
    return res.status(500).json({ message: "Server error in limit check" });
  }
};