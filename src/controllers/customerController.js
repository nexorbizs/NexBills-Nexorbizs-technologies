import prisma from "../config/prisma.js";

/* ADD CUSTOMER */
export const addCustomer = async (req, res) => {
  try {
    const { name, phone, address, branchId } = req.body; // ⭐ branchId

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
        name,
        phone,
        address,
        companyId: req.companyId,
        branchId: branchId ? Number(branchId) : null // ⭐ save branchId
      }
    });

    res.json(customer);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* GET CUSTOMERS */
export const getCustomers = async (req, res) => {
  try {
    const { branchIds } = req.query; // ⭐ branchIds filter

    const where = { companyId: req.companyId };

    // ⭐ Filter by assigned branches for CASHIER/MANAGER
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

    await prisma.customer.delete({
      where: { id: Number(id) }
    });

    res.json({ message: "Customer deleted" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};