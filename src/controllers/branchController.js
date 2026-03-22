import prisma from "../config/prisma.js";

/* ================= GET BRANCHES ================= */
export const getBranches = async (req, res) => {
  try {
    const branches = await prisma.branch.findMany({
      where: { companyId: req.companyId },
      orderBy: { id: "asc" }
    });
    res.json(branches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= CREATE BRANCH ================= */
export const createBranch = async (req, res) => {
  try {
    const { name, address, phone } = req.body;

    if (!name?.trim())
      return res.status(400).json({ error: "Branch name required" });

    // ⭐ CHECK SUBSCRIPTION BRANCH LIMIT
    const subscription = await prisma.subscription.findUnique({
      where: { companyId: req.companyId }
    });

    const branchCount = await prisma.branch.count({
      where: { companyId: req.companyId }
    });

    if (subscription && branchCount >= subscription.maxBranches)
      return res.status(400).json({
        error: `Branch limit reached (${subscription.maxBranches}). Upgrade your plan.`
      });

    const branch = await prisma.branch.create({
      data: {
        name: name.trim(),
        address: address || "",
        phone: phone || "",
        companyId: req.companyId
      }
    });

    res.json(branch);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= UPDATE BRANCH ================= */
export const updateBranch = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, address, phone, isActive } = req.body;

    const branch = await prisma.branch.update({
      where: { id },
      data: {
        name: name?.trim(),
        address: address || "",
        phone: phone || "",
        isActive: isActive !== undefined ? isActive : true
      }
    });

    res.json(branch);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= DELETE BRANCH ================= */
export const deleteBranch = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const salesCount = await prisma.sale.count({ where: { branchId: id } });
    if (salesCount > 0)
      return res.status(400).json({
        error: `Cannot delete — branch has ${salesCount} sale(s).`
      });

    await prisma.branch.delete({ where: { id } });
    res.json({ message: "Branch deleted" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= BRANCH DASHBOARD ================= */
export const branchDashboard = async (req, res) => {
  try {
    const branches = await prisma.branch.findMany({
      where: { companyId: req.companyId },
      orderBy: { id: "asc" }
    });

    const branchStats = await Promise.all(
      branches.map(async (branch) => {
        const salesAgg = await prisma.sale.aggregate({
          _sum: { total: true },
          _count: true,
          where: { branchId: branch.id }
        });

        return {
          id: branch.id,
          name: branch.name,
          address: branch.address,
          phone: branch.phone,
          isActive: branch.isActive,
          totalSales: salesAgg._sum.total || 0,
          totalInvoices: salesAgg._count || 0
        };
      })
    );

    res.json(branchStats);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};