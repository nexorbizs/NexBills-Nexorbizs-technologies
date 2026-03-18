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