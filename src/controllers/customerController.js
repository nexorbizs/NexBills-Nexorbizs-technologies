import prisma from "../config/prisma.js";
import { logActivity } from "../utils/activityLogger.js";

/* ADD CUSTOMER */
export const addCustomer = async (req, res) => {
  try {
    const { name, phone, address, branchId } = req.body;

    if (!name || !phone || !address)
      return res.status(400).json({ error: "All fields required" });

    const existing = await prisma.customer.findFirst({
      where: { phone, companyId: req.companyId }
    });

    if (existing)
      return res.status(400).json({
        error: `Phone already exists for customer: ${existing.name}`
      });

    const customer = await prisma.customer.create({
      data: {
        name, phone, address,
        companyId: req.companyId,
        branchId: branchId ? Number(branchId) : null
      }
    });

    // ⭐ Get branch name for log
    const branch = branchId
      ? await prisma.branch.findUnique({ where: { id: Number(branchId) } })
      : null;

    await logActivity({
      companyId: req.companyId,
      userId: req.userId,
      branchId: branchId ? Number(branchId) : null,
      userName: req.userName || "Unknown",
      branchName: branch?.name || "",
      module: "CUSTOMER",
      action: "CREATED",
      summary: `Added customer "${name}" — ${phone}`,
      details: JSON.stringify({ name, phone, address })
    });

    res.json(customer);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* GET CUSTOMERS */
export const getCustomers = async (req, res) => {
  try {
    const { branchIds } = req.query;
    const where = { companyId: req.companyId };

    if (branchIds) {
      const ids = branchIds.split(",").map(Number);
      where.branchId = { in: ids };
    }

    const customers = await prisma.customer.findMany({
      where,
      orderBy: { id: "desc" }
    });

    res.json(customers);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* DELETE CUSTOMER */
export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id: Number(id) }
    });

    await prisma.customer.delete({ where: { id: Number(id) } });

    await logActivity({
      companyId: req.companyId,
      userId: req.userId,
      userName: req.userName || "Unknown",
      module: "CUSTOMER",
      action: "DELETED",
      summary: `Deleted customer "${customer?.name}" — ${customer?.phone}`,
      details: JSON.stringify({ customerId: id, name: customer?.name })
    });

    res.json({ message: "Customer deleted" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};