import express from "express";
import { createSale, getSales } from "../controllers/saleController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { downloadInvoice } from "../controllers/invoiceController.js";

const router = express.Router();

router.post("/", authMiddleware, createSale);
router.get("/", authMiddleware, getSales);

/* ⭐ PDF ROUTE */
router.get("/pdf/:id", authMiddleware, downloadInvoice);

export default router;