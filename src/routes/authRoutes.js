import express from "express";
import { signup, login, verifySecret } from "../controllers/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/verify-code", verifySecret);
router.post("/signup", signup);
router.post("/login", login);

router.get("/test", authMiddleware, (req, res) => {
  res.json({
    message: "JWT WORKING ✅",
    companyId: req.companyId
  });
});

export default router;