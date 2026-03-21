import express from "express";
import {
  createPurchase,
  getPurchases,
  getPurchaseById
} from "../controllers/purchaseController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, createPurchase);
router.get("/", authMiddleware, getPurchases);
router.get("/:id", authMiddleware, getPurchaseById);

export default router;