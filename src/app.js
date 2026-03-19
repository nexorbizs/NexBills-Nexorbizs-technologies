import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import { authMiddleware } from "./middleware/authMiddleware.js";
import productRoutes from "./routes/productRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import saleRoutes from "./routes/saleRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import settingRoutes from "./routes/settingRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";



const app = express();



app.use(cors());
app.use(express.json());

app.get("/", (req, res)=>{
  res.send("NexBills Backend Running")
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/settings", settingRoutes);
app.use("/api/invoice", invoiceRoutes);

app.get("/api/test", authMiddleware, (req, res) => {
  res.json({
    message: "Tenant middleware working",
    companyId: req.companyId
  });
});

export default app;