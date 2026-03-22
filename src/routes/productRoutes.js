import express from "express";
import {
  addProduct,
  getProducts,
  deleteProduct,
  updateStock,
  updateProduct,        // ⭐ NEW
  getProductByBarcode
} from "../controllers/productController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, addProduct);
router.get("/", authMiddleware, getProducts);
router.get("/barcode/:barcode", authMiddleware, getProductByBarcode);
router.put("/:id", authMiddleware, updateProduct);        // ⭐ NEW
router.delete("/:id", authMiddleware, deleteProduct);
router.put("/stock/:id", authMiddleware, updateStock);

export default router;