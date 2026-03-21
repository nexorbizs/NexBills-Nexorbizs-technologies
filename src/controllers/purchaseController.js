import prisma from "../config/prisma.js";

/* ⭐ AUTO PURCHASE NO GENERATOR */
const generatePurchaseNo = async (companyId) => {
  const last = await prisma.purchase.findFirst({
    where: { companyId },
    orderBy: { id: "desc" }
  });
  const next = last ? last.id + 1 : 1;
  return `PUR-${String(next).padStart(4, "0")}`;
};

/* ================= CREATE PURCHASE ================= */
export const createPurchase = async (req, res) => {
  try {
    const {
      supplierId,
      paymentMode,
      amountPaid,
      notes,
      items
    } = req.body;

    if (!supplierId || !items || items.length === 0)
      return res.status(400).json({ error: "Supplier and items required" });

    const supplier = await prisma.supplier.findUnique({
      where: { id: Number(supplierId) }
    });

    if (!supplier)
      return res.status(404).json({ error: "Supplier not found" });

    const purchaseNo = await generatePurchaseNo(req.companyId);

    let subTotal = 0;
    let taxAmount = 0;
    const purchaseItems = [];

    for (const i of items) {
      const product = await prisma.product.findUnique({
        where: { id: i.productId }
      });

      if (!product)
        return res.status(400).json({ error: "Product not found" });

      const taxable = Number(i.price) * Number(i.qty);
      const cgstAmt = taxable * Number(i.cgst || 0) / 100;
      const sgstAmt = taxable * Number(i.sgst || 0) / 100;
      const total = taxable + cgstAmt + sgstAmt;

      subTotal += taxable;
      taxAmount += cgstAmt + sgstAmt;

      purchaseItems.push({
        productId: product.id,
        productName: product.name,
        hsn: product.hsn,
        qty: Number(i.qty),
        price: Number(i.price),
        cgst: Number(i.cgst || 0),
        sgst: Number(i.sgst || 0),
        total
      });

      // ⭐ INCREASE STOCK
      await prisma.product.update({
        where: { id: product.id },
        data: { stock: { increment: Number(i.qty) } }
      });
    }

    const total = subTotal + taxAmount;
    const balance = total - Number(amountPaid || 0);

    const purchase = await prisma.purchase.create({
      data: {
        purchaseNo,
        supplierId: Number(supplierId),
        supplierName: supplier.name,
        subTotal,
        taxAmount,
        total,
        paymentMode: paymentMode || "cash",
        amountPaid: Number(amountPaid || 0),
        balance,
        notes: notes || "",
        companyId: req.companyId,
        items: { create: purchaseItems }
      },
      include: { items: true }
    });

    res.json({ message: "Purchase created", purchase });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= GET PURCHASES ================= */
export const getPurchases = async (req, res) => {
  try {
    const purchases = await prisma.purchase.findMany({
      where: { companyId: req.companyId },
      include: { items: true, supplier: true },
      orderBy: { id: "desc" }
    });

    res.json(purchases);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= GET PURCHASE BY ID ================= */
export const getPurchaseById = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const purchase = await prisma.purchase.findFirst({
      where: { id, companyId: req.companyId },
      include: { items: true, supplier: true }
    });

    if (!purchase)
      return res.status(404).json({ error: "Purchase not found" });

    res.json(purchase);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};