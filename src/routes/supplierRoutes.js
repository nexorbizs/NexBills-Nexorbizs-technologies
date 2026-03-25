import express from "express";
import {
  addSupplier,
  getSuppliers,
  deleteSupplier
} from "../controllers/supplierController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import checkFeature from "../middleware/checkFeature.js";

const router = express.Router();

router.post("/", authMiddleware, checkFeature("supplier_management"), addSupplier);
router.get("/", authMiddleware, checkFeature("supplier_management"), getSuppliers);
router.delete("/:id", authMiddleware, checkFeature("supplier_management"), deleteSupplier);

export default router;