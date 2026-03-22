import prisma from "../config/prisma.js";

/* ================= GET SUBSCRIPTION ================= */
export const getSubscription = async (req, res) => {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { companyId: req.companyId }
    });
    res.json(subscription || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= ADMIN - SET SUBSCRIPTION ================= */
export const setSubscription = async (req, res) => {
  try {
    const { secret, companyId, plan, days, maxUsers, maxBranches, notes } = req.body;

    if (secret !== process.env.ADMIN_SECRET)
      return res.status(401).json({ error: "Unauthorized" });

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + Number(days || 30));

    const subscription = await prisma.subscription.upsert({
      where: { companyId: Number(companyId) },
      update: {
        plan: plan || "basic",
        status: "active",
        expiryDate,
        maxUsers: Number(maxUsers || 1),
        maxBranches: Number(maxBranches || 1),
        notes: notes || ""
      },
      create: {
        companyId: Number(companyId),
        plan: plan || "basic",
        status: "active",
        expiryDate,
        maxUsers: Number(maxUsers || 1),
        maxBranches: Number(maxBranches || 1),
        notes: notes || ""
      }
    });

    res.json({ message: "Subscription updated", subscription });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= ADMIN - GET ALL COMPANIES ================= */
export const getAllCompanies = async (req, res) => {
  try {
    const { secret } = req.query;

    if (secret !== process.env.ADMIN_SECRET)
      return res.status(401).json({ error: "Unauthorized" });

    const companies = await prisma.company.findMany({
      include: {
        subscription: true,
        // ⭐ Count branches, users, sales
        _count: {
          select: {
            branches: true,
            users: true,
            sales: true
          }
        }
      },
      orderBy: { id: "desc" }
    });

    // ⭐ Add last sale date as last activity + days left
    const enriched = companies.map(c => {
      const expiry = c.subscription?.expiryDate;
      const daysLeft = expiry
        ? Math.ceil((new Date(expiry) - new Date()) / (1000 * 60 * 60 * 24))
        : null;

      return {
        ...c,
        branchCount: c._count.branches,
        userCount: c._count.users,
        salesCount: c._count.sales,
        daysLeft,
      };
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= ADMIN - SUSPEND SUBSCRIPTION ================= */
export const suspendSubscription = async (req, res) => {
  try {
    const { secret, companyId } = req.body;

    if (secret !== process.env.ADMIN_SECRET)
      return res.status(401).json({ error: "Unauthorized" });

    const subscription = await prisma.subscription.update({
      where: { companyId: Number(companyId) },
      data: { status: "suspended" }
    });

    res.json({ message: "Subscription suspended", subscription });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= ADMIN - UNSUSPEND ================= */ // ⭐ NEW
export const unsuspendSubscription = async (req, res) => {
  try {
    const { secret, companyId } = req.body;

    if (secret !== process.env.ADMIN_SECRET)
      return res.status(401).json({ error: "Unauthorized" });

    const subscription = await prisma.subscription.update({
      where: { companyId: Number(companyId) },
      data: { status: "active" }
    });

    res.json({ message: "Subscription reactivated", subscription });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= ADMIN - EXTEND DAYS ================= */ // ⭐ NEW
export const extendSubscription = async (req, res) => {
  try {
    const { secret, companyId, days } = req.body;

    if (secret !== process.env.ADMIN_SECRET)
      return res.status(401).json({ error: "Unauthorized" });

    const existing = await prisma.subscription.findUnique({
      where: { companyId: Number(companyId) }
    });

    if (!existing)
      return res.status(404).json({ error: "Subscription not found" });

    // Extend from current expiry or today, whichever is later
    const base = new Date(existing.expiryDate) > new Date()
      ? new Date(existing.expiryDate)
      : new Date();

    base.setDate(base.getDate() + Number(days));

    const subscription = await prisma.subscription.update({
      where: { companyId: Number(companyId) },
      data: { expiryDate: base, status: "active" }
    });

    res.json({ message: `Extended by ${days} days`, subscription });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};