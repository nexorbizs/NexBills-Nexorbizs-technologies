import prisma from "../config/prisma.js";
import { generateInvoicePdf } from "../utils/invoicePdf.js";

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
      items
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

      const taxable = product.price * i.qty;
      const cgstAmt = taxable * product.cgst / 100;
      const sgstAmt = taxable * product.sgst / 100;
      const total = taxable + cgstAmt + sgstAmt;

      subTotal += taxable;
      totalGST += cgstAmt + sgstAmt;

      saleItems.push({
        productId: product.id,
        productName: product.name,
        hsn: product.hsn,
        price: product.price,
        qty: i.qty,
        cgst: product.cgst,
        sgst: product.sgst,
        total
      });

      await prisma.product.update({
        where: { id: product.id },
        data: { stock: { decrement: i.qty } }
      });
    }

    const grandTotal = subTotal + totalGST;
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
        roundOff,
        total: finalTotal,
        paymentMode,
        amountReceived,
        balance,
        companyId: req.companyId,
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