import prisma from "../config/prisma.js";

/* ⭐ AUTO INVOICE GENERATOR */
const generateInvoice = async (companyId) => {
  const lastSale = await prisma.sale.findFirst({
    where: { companyId },
    orderBy: { id: "desc" }
  });

  const nextNumber = lastSale ? lastSale.id + 1 : 1;
  return `INV-${String(nextNumber).padStart(4, "0")}`;
};

/* ================= CREATE SALE ================= */
export const createSale = async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      paymentMode,
      amountReceived,
      items,
      discountType = "percent",  // "percent" or "flat"
      discountValue = 0          // % or ₹ amount
    } = req.body;

    const invoiceNo = await generateInvoice(req.companyId);

    let subTotal = 0;
    let totalGST = 0;
    const saleItems = [];

    for (const i of items) {

      const product = await prisma.product.findUnique({
        where: { id: i.productId }
      });

      if (!product)
        return res.status(400).json({ message: "Product not found" });

      if (product.stock < i.qty)
        return res.status(400).json({ message: `${product.name} stock low` });

      // ⭐ ITEM DISCOUNT
      const itemDiscount = Number(i.discount || 0);
      const originalPrice = product.price;
      const discountedPrice = originalPrice * (1 - itemDiscount / 100);

      const taxable = discountedPrice * i.qty;
      const cgstAmt = taxable * product.cgst / 100;
      const sgstAmt = taxable * product.sgst / 100;
      const total = taxable + cgstAmt + sgstAmt;

      subTotal += taxable;
      totalGST += cgstAmt + sgstAmt;

      saleItems.push({
        productId: product.id,
        productName: product.name,
        hsn: product.hsn,
        price: originalPrice,
        qty: i.qty,
        discount: itemDiscount,
        discountedPrice,
        cgst: product.cgst,
        sgst: product.sgst,
        total
      });

      await prisma.product.update({
        where: { id: product.id },
        data: { stock: { decrement: i.qty } }
      });
    }

    // ⭐ BILL LEVEL DISCOUNT
    let discountAmount = 0;

    if (discountType === "percent") {
      discountAmount = subTotal * Number(discountValue) / 100;
    } else {
      discountAmount = Number(discountValue);
    }

    // ⭐ APPLY BILL DISCOUNT BEFORE GST
    const discountedSubTotal = subTotal - discountAmount;

    // Recalculate GST on discounted subtotal
    const gstMultiplier = subTotal > 0 ? discountedSubTotal / subTotal : 1;
    const adjustedGST = totalGST * gstMultiplier;

    const grandTotal = discountedSubTotal + adjustedGST;
    const roundOff = Math.round(grandTotal) - grandTotal;
    const finalTotal = Math.round(grandTotal);

    const balance =
      paymentMode === "cash"
        ? amountReceived - finalTotal
        : 0;

    const sale = await prisma.sale.create({
      data: {
        invoiceNo,
        customerName,
        customerPhone,
        subTotal,
        discountType,
        discountValue: Number(discountValue),
        discountAmount,
        roundOff,
        total: finalTotal,
        paymentMode,
        amountReceived,
        balance,
        companyId: req.companyId,
        branchId: req.body.branchId ? Number(req.body.branchId) : null,
        items: { create: saleItems }
      },
      include: { items: true }
    });

    res.json({ message: "Sale created", sale });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= GET SALES ================= */
export const getSales = async (req, res) => {
  try {
    const sales = await prisma.sale.findMany({
      where: { companyId: req.companyId },
      include: { items: true },
      orderBy: { id: "desc" }
    });

    res.json(sales);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= GET INVOICE PDF ================= */
export const getInvoicePdf = async (req, res) => {
  try {

    const { invoiceNo } = req.params;

    const sale = await prisma.sale.findFirst({
      where: {
        invoiceNo,
        companyId: req.companyId
      },
      include: {
        items: true,
        company: {
          include: { setting: true }
        }
      }
    });

    if (!sale)
      return res.status(404).json({ message: "Invoice not found" });

    generateInvoicePdf(sale, res);

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "PDF generation failed" });
  }
};