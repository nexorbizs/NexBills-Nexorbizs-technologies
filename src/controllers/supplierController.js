import prisma from "../config/prisma.js";

/* ================= ADD SUPPLIER ================= */
export const addSupplier = async (req, res) => {
  try {
    const { name, phone, address, gstin } = req.body;

    if (!name || !phone || !address)
      return res.status(400).json({ error: "Name, phone and address required" });

    // ⭐ DUPLICATE PHONE CHECK
    const existing = await prisma.supplier.findFirst({
      where: { phone, companyId: req.companyId }
    });

    if (existing)
      return res.status(400).json({
        error: `Phone already exists for supplier: ${existing.name}`
      });

    const supplier = await prisma.supplier.create({
      data: {
        name,
        phone,
        address,
        gstin: gstin || "",
        companyId: req.companyId
      }
    });

    res.json(supplier);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= GET SUPPLIERS ================= */
export const getSuppliers = async (req, res) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      where: { companyId: req.companyId },
      orderBy: { id: "desc" }
    });

    res.json(suppliers);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= DELETE SUPPLIER ================= */
export const deleteSupplier = async (req, res) => {
  try {
    const id = Number(req.params.id);

    // ⭐ CHECK IF SUPPLIER HAS PURCHASES
    const purchaseCount = await prisma.purchase.count({
      where: { supplierId: id }
    });

    if (purchaseCount > 0)
      return res.status(400).json({
        error: `Cannot delete — supplier has ${purchaseCount} purchase(s).`
      });

    await prisma.supplier.delete({ where: { id } });

    res.json({ message: "Supplier deleted" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};