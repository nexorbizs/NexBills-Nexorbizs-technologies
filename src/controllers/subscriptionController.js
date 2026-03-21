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

    // ⭐ ADMIN SECRET CHECK
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
      include: { subscription: true },
      orderBy: { id: "desc" }
    });

    res.json(companies);

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