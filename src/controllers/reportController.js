import prisma from "../config/prisma.js";

/* DASHBOARD SUMMARY */
export const dashboardSummary = async (req, res) => {
  try {
    const companyId = req.companyId;

    const totalSales = await prisma.sale.aggregate({
      _sum: { total: true },
      where: { companyId }
    });

    const totalInvoices = await prisma.sale.count({
      where: { companyId }
    });

    const totalProducts = await prisma.product.count({
      where: { companyId }
    });

    const totalCustomers = await prisma.customer.count({
      where: { companyId }
    });

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
    today.setHours(0,0,0,0);

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
    const { from, to } = req.query;

    if (!from || !to)
      return res.status(400).json({ message: "From & To date required" });

    const sales = await prisma.sale.findMany({
      where: {
        companyId,
        createdAt: {
          gte: new Date(from),
          lte: new Date(to)
        }
      },
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

/* ================= PROFIT & LOSS REPORT ================= */
export const profitLossReport = async (req, res) => {
  try {
    const companyId = req.companyId;
    const { from, to } = req.query;

    const dateFilter = from && to ? {
      createdAt: {
        gte: new Date(from),
        lte: new Date(to)
      }
    } : {};

    // ⭐ GET SALES
    const sales = await prisma.sale.findMany({
      where: { companyId, ...dateFilter },
      include: { items: true }
    });

    // ⭐ GET PURCHASES
    const purchases = await prisma.purchase.findMany({
      where: { companyId, ...dateFilter },
      include: { items: true }
    });

    // ⭐ TOTAL REVENUE
    const totalRevenue = sales.reduce((s, sale) => s + sale.total, 0);

    // ⭐ TOTAL PURCHASE COST
    const totalCost = purchases.reduce((s, p) => s + p.total, 0);

    // ⭐ GROSS PROFIT
    const grossProfit = totalRevenue - totalCost;

    // ⭐ TOTAL DISCOUNT GIVEN
    const totalDiscount = sales.reduce((s, sale) =>
      s + (sale.discountAmount || 0), 0
    );

    // ⭐ PER PRODUCT PROFIT
    const productMap = {};

    // Sales side
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

    // Purchase side
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

    // Calculate profit per product
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