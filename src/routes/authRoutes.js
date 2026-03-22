import express from "express";
import { signup, login, verifySecret, sendOtp, verifyOtp, resetPassword } from "../controllers/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/verify-code", verifySecret);
router.post("/signup", signup);
router.post("/login", login);

// ⭐ FORGOT PASSWORD ROUTES
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);

router.get("/test", authMiddleware, (req, res) => {
  res.json({
    message: "JWT WORKING ✅",
    companyId: req.companyId
  });
});

export default router;