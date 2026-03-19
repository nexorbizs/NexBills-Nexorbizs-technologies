import dotenv from "dotenv";
dotenv.config();

process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("❌ Unhandled Rejection:", reason);
  process.exit(1);
});

console.log("⭐ Step 1: dotenv loaded");

import app from "./app.js";
import prisma from "./config/prisma.js";

console.log("⭐ Step 2: app imported");

const PORT = process.env.PORT || 8080;

app.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 NexBills Backend Running on", PORT);
});

console.log("⭐ Step 3: listen called");

// Force DB connection test
prisma.$connect()
  .then(() => console.log("✅ DB connected successfully"))
  .catch((err) => {
    console.error("❌ DB connection failed:", err);
    process.exit(1);
  });