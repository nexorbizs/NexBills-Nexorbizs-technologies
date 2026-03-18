import express from "express";
import prisma from "../config/prisma.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { generateInvoicePdf } from "../utils/invoicePdf.js";

const router = express.Router();

/* ⭐ GET INVOICE PDF */
router.get("/sales/pdf/:invoiceNo", authMiddleware, async (req, res) => {
  try {

    const sale = await prisma.sale.findFirst({
      where: {
        invoiceNo: req.params.invoiceNo,
        companyId: req.companyId
      },
      include: { items: true }
    });

    if (!sale)
      return res.status(404).json({ message: "Invoice not found" });

    generateInvoicePdf(sale, res);

  } catch (err) {
    res.status(500).json({ message: "PDF generation failed" });
  }
});

export default router;