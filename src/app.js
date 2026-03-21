import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import saleRoutes from "./routes/saleRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import settingRoutes from "./routes/settingRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import supplierRoutes from "./routes/supplierRoutes.js";
import purchaseRoutes from "./routes/purchaseRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";

const app = express();

// ⭐ MIDDLEWARE FIRST
app.use(cors());
app.use(express.json());

// ⭐ ROOT (optional)
app.get("/", (req, res) => {
  res.send("NexBills Backend Running");
});

// ⭐ HEALTHCHECK (VERY IMPORTANT)
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// ⭐ ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/settings", settingRoutes);
app.use("/api/invoice", invoiceRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/subscriptions", subscriptionRoutes);

export default app;