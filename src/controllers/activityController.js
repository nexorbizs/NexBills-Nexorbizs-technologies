import prisma from "../config/prisma.js";

/* ================= GET ACTIVITY LOGS ================= */
export const getActivityLogs = async (req, res) => {
  try {
    const { branchId, module, from, to, limit = 100 } = req.query;

    const where = { companyId: req.companyId };

    if (branchId) where.branchId = Number(branchId);
    if (module) where.module = module;
    if (from && to) {
      where.createdAt = {
        gte: new Date(from),
        lte: new Date(to)
      };
    }

    const logs = await prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: Number(limit)
    });

    res.json(logs);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};