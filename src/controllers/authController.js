import prisma from "../config/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendOtpEmail } from "../utils/sendEmail.js"; // ⭐

// ⭐ Plan days mapping
const planDays = {
  trial: 7,
  basic: 30,
  pro: 180,
  enterprise: 365,
  lifetime: 36500
};

const planMaxUsers = {
  trial: 1,
  basic: 3,
  pro: 10,
  enterprise: 25,
  lifetime: 999
};

const planMaxBranches = {
  trial: 1,
  basic: 1,
  pro: 3,
  enterprise: 10,
  lifetime: 999
};

/* ================= VERIFY SECRET ================= */

export const verifySecret = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: "Code required" });
    if (code !== process.env.ADMIN_SECRET)
      return res.status(401).json({ message: "Invalid code" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= SIGNUP ================= */

export const signup = async (req, res) => {
  try {
    const { name, email, password, secret, plan = "trial" } = req.body;

    if (!name || !email || !password || !secret)
      return res.status(400).json({ message: "Missing field" });

    if (secret !== process.env.ADMIN_SECRET)
      return res.status(401).json({ message: "Invalid secret" });

    const exist = await prisma.company.findUnique({ where: { email } });
    if (exist)
      return res.status(400).json({ message: "Company already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const newCompany = await prisma.company.create({
      data: { name, email, password: hashed }
    });

    await prisma.user.create({
      data: {
        email,
        password: hashed,
        role: "OWNER",
        name,
        companyId: newCompany.id
      }
    });

    const days = planDays[plan] || 30;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);

    await prisma.subscription.create({
      data: {
        companyId: newCompany.id,
        plan,
        status: "active",
        expiryDate,
        maxUsers: planMaxUsers[plan] || 1,
        maxBranches: planMaxBranches[plan] || 1,
        notes: `Auto created on signup — ${plan} plan`
      }
    });

    res.json({ message: "Signup success" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= LOGIN ================= */

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const company = await prisma.company.findUnique({
      where: { email },
      include: { subscription: true }
    });

    if (!company)
      return res.status(400).json({ message: "Company not found" });

    const match = await bcrypt.compare(password, company.password);
    if (!match)
      return res.status(400).json({ message: "Invalid password" });

    const sub = company.subscription;

    if (!sub)
      return res.status(403).json({
        message: "No active subscription. Contact support.",
        subscriptionExpired: true
      });

    if (sub.status === "suspended")
      return res.status(403).json({
        message: "Your account has been suspended. Contact support.",
        subscriptionExpired: true
      });

    if (sub.plan !== "lifetime" && new Date() > new Date(sub.expiryDate)) {
      await prisma.subscription.update({
        where: { companyId: company.id },
        data: { status: "expired" }
      });
      return res.status(403).json({
        message: `Subscription expired on ${new Date(sub.expiryDate).toLocaleDateString("en-IN")}. Contact support to renew.`,
        subscriptionExpired: true
      });
    }

    const ownerUser = await prisma.user.findFirst({
      where: { companyId: company.id, role: "OWNER" }
    });

    const token = jwt.sign(
      { companyId: company.id, userId: ownerUser?.id, role: ownerUser?.role || "OWNER" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const { password: _, ...companyData } = company;

    res.json({
      token,
      company: companyData,
      subscription: {
        plan: sub.plan,
        status: sub.status,
        expiryDate: sub.expiryDate,
        daysLeft: sub.plan === "lifetime"
          ? 99999
          : Math.ceil((new Date(sub.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))
      },
      user: {
        id: ownerUser?.id,
        name: ownerUser?.name || company.name,
        email: company.email,
        role: "OWNER"
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= SEND OTP ================= */ // ⭐ NEW

export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });

    // Check if company or staff user exists
    const company = await prisma.company.findUnique({ where: { email } });
    const user = await prisma.user.findUnique({ where: { email } });

    if (!company && !user)
      return res.status(404).json({ message: "No account found with this email" });

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Invalidate old OTPs for this email
    await prisma.otpCode.updateMany({
      where: { email, used: false },
      data: { used: true }
    });

    // Save new OTP
    await prisma.otpCode.create({
      data: { email, otp, expiresAt }
    });

    // Send email
    await sendOtpEmail(email, otp);

    res.json({ message: "OTP sent to your email" });

  } catch (err) {
    console.error("Send OTP error:", err);
    res.status(500).json({ message: "Failed to send OTP. Try again." });
  }
};

/* ================= VERIFY OTP ================= */ // ⭐ NEW

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ message: "Email and OTP required" });

    const record = await prisma.otpCode.findFirst({
      where: { email, otp, used: false },
      orderBy: { createdAt: "desc" }
    });

    if (!record)
      return res.status(400).json({ message: "Invalid OTP" });

    if (new Date() > new Date(record.expiresAt))
      return res.status(400).json({ message: "OTP expired. Request a new one." });

    // Mark OTP as used
    await prisma.otpCode.update({
      where: { id: record.id },
      data: { used: true }
    });

    res.json({ message: "OTP verified", verified: true });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= RESET PASSWORD ================= */ // ⭐ NEW

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword)
      return res.status(400).json({ message: "All fields required" });

    if (newPassword.length < 6)
      return res.status(400).json({ message: "Password must be at least 6 characters" });

    // Verify OTP one more time
    const record = await prisma.otpCode.findFirst({
      where: { email, otp },
      orderBy: { createdAt: "desc" }
    });

    if (!record)
      return res.status(400).json({ message: "Invalid or expired OTP" });

    const hashed = await bcrypt.hash(newPassword, 10);

    // Update company password if owner
    const company = await prisma.company.findUnique({ where: { email } });
    if (company) {
      await prisma.company.update({
        where: { email },
        data: { password: hashed }
      });
      await prisma.user.updateMany({
        where: { email, role: "OWNER" },
        data: { password: hashed }
      });
    } else {
      // Update staff user password
      await prisma.user.update({
        where: { email },
        data: { password: hashed }
      });
    }

    res.json({ message: "Password reset successfully" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};