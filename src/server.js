
import dotenv from "dotenv";
dotenv.config()

import app from "./app.js";

const PORT = process.env.PORT || 5000;

console.log("DATABASE_URL:", process.env.DATABASE_URL?"FOUND" : "MISSING");
app.listen(PORT,"0.0.0.0",() => {
  console.log("🚀 NexBills Backend Running on", PORT);
});