import express from "express";
import { addProduct, getProducts, deleteProduct, updateStock } from "../controllers/productController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, addProduct);
router.get("/", authMiddleware, getProducts);
router.delete("/:id", authMiddleware, deleteProduct);
router.put("/stock/:id", authMiddleware, updateStock);

export default router;