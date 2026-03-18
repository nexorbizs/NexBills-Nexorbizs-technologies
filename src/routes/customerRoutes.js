import express from "express";
import { addCustomer, getCustomers, deleteCustomer } from "../controllers/customerController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, addCustomer);
router.get("/", authMiddleware, getCustomers);
router.delete("/:id", authMiddleware, deleteCustomer);

export default router;