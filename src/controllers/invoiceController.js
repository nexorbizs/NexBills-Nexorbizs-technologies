import prisma from "../config/prisma.js";
import { generateInvoicePdf } from "../utils/invoicePdf.js";

/* GET INVOICE JSON */
export const getInvoice = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        items: true,
        company: {
          include: { setting: true }
        }
      }
    });

    if (!sale)
      return res.status(404).json({ message: "Invoice not found" });

    res.json(sale);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* DOWNLOAD INVOICE PDF */
export const downloadInvoice = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const sale = await prisma.sale.findUnique({
      where: { id },
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
    res.status(500).json({ error: err.message });
  }
};