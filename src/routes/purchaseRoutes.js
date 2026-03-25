import express from "express";
import {
  createPurchase,
  getPurchases,
  getPurchaseById
} from "../controllers/purchaseController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import checkFeature from "../middleware/checkFeature.js";

const router = express.Router();

router.post("/", authMiddleware, checkFeature("purchase_management"), createPurchase);
router.get("/", authMiddleware, checkFeature("purchase_management"), getPurchases);
router.get("/:id", authMiddleware, checkFeature("purchase_management"), getPurchaseById);

export default router;