import prisma from "../config/prisma.js";

/* DASHBOARD SUMMARY */
export const dashboardSummary = async (req, res) => {
  try {
    const companyId = req.companyId;

    const totalSales = await prisma.sale.aggregate({
      _sum: { total: true },
      where: { companyId }
    });

    const totalInvoices = await prisma.sale.count({ where: { companyId } });
    const totalProducts = await prisma.product.count({ where: { companyId } });
    const totalCustomers = await prisma.customer.count({ where: { companyId } });

    res.json({
      revenue: totalSales._sum.total || 0,
      invoices: totalInvoices,
      products: totalProducts,
      customers: totalCustomers
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* DAILY SALES */
export const todaySales = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sales = await prisma.sale.findMany({
      where: {
        companyId: req.companyId,
        createdAt: { gte: today }
      },
      include: { items: true }
    });

    res.json(sales);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* DATE RANGE SALES REPORT */
export const salesReport = async (req, res) => {
  try {
    const companyId = req.companyId;
    const { from, to, branchId } = req.query; // ⭐ added branchId

    if (!from || !to)
      return res.status(400).json({ message: "From & To date required" });

    const where = {
      companyId,
      createdAt: {
        gte: new Date(from),
        lte: new Date(to)
      }
    };

    // ⭐ Filter by branch if provided
    if (branchId) where.branchId = Number(branchId);

    const sales = await prisma.sale.findMany({
      where,
      include: { items: true },
      orderBy: { id: "desc" }
    });

    const revenue = sales.reduce((sum, s) => sum + s.total, 0);

    res.json({
      totalInvoices: sales.length,
      totalRevenue: revenue,
      sales
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* PROFIT & LOSS REPORT */
export const profitLossReport = async (req, res) => {
  try {
    const companyId = req.companyId;
    const { from, to, branchId } = req.query; // ⭐ added branchId

    const dateFilter = from && to ? {
      createdAt: {
        gte: new Date(from),
        lte: new Date(to)
      }
    } : {};

    const branchFilter = branchId ? { branchId: Number(branchId) } : {}; // ⭐

    const sales = await prisma.sale.findMany({
      where: { companyId, ...dateFilter, ...branchFilter },
      include: { items: true }
    });

    const purchases = await prisma.purchase.findMany({
      where: { companyId, ...dateFilter, ...branchFilter },
      include: { items: true }
    });

    const totalRevenue = sales.reduce((s, sale) => s + sale.total, 0);
    const totalCost = purchases.reduce((s, p) => s + p.total, 0);
    const grossProfit = totalRevenue - totalCost;
    const totalDiscount = sales.reduce((s, sale) => s + (sale.discountAmount || 0), 0);

    const productMap = {};

    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (!productMap[item.productName]) {
          productMap[item.productName] = {
            name: item.productName,
            qtySold: 0,
            salesRevenue: 0,
            purchaseCost: 0,
            profit: 0
          };
        }
        productMap[item.productName].qtySold += item.qty;
        productMap[item.productName].salesRevenue += item.total;
      });
    });

    purchases.forEach(purchase => {
      purchase.items.forEach(item => {
        if (!productMap[item.productName]) {
          productMap[item.productName] = {
            name: item.productName,
            qtySold: 0,
            salesRevenue: 0,
            purchaseCost: 0,
            profit: 0
          };
        }
        productMap[item.productName].purchaseCost += item.total;
      });
    });

    const productBreakdown = Object.values(productMap).map(p => ({
      ...p,
      profit: p.salesRevenue - p.purchaseCost
    }));

    res.json({
      totalRevenue,
      totalCost,
      grossProfit,
      totalDiscount,
      totalSales: sales.length,
      totalPurchases: purchases.length,
      productBreakdown
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};