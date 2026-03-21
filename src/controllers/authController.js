import prisma from "../config/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

/* ================= VERIFY SECRET ================= */

export const verifySecret = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code)
      return res.status(400).json({ message: "Code required" });

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
    const { name, email, password, secret } = req.body;

    if (!name || !email || !password || !secret)
      return res.status(400).json({ message: "Missing field" });

    if (secret !== process.env.ADMIN_SECRET)
      return res.status(401).json({ message: "Invalid secret" });

    const exist = await prisma.company.findUnique({
      where: { email }
    });

    if (exist)
      return res.status(400).json({ message: "Company already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const newCompany = await prisma.company.create({
      data: { name, email, password: hashed }
    });

    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        role: "OWNER",
        name,
        companyId: newCompany.id
      }
    });

    // ⭐ AUTO CREATE 30 DAY TRIAL SUBSCRIPTION
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    await prisma.subscription.create({
      data: {
        companyId: newCompany.id,
        plan: "trial",
        status: "active",
        expiryDate,
        maxUsers: 1,
        maxBranches: 1,
        notes: "Auto trial on signup"
      }
    });

    res.json({ message: "Signup success", user });

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

    // ⭐ SUBSCRIPTION CHECK
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

    if (new Date() > new Date(sub.expiryDate)) {
      // ⭐ AUTO MARK AS EXPIRED
      await prisma.subscription.update({
        where: { companyId: company.id },
        data: { status: "expired" }
      });

      return res.status(403).json({
        message: `Subscription expired on ${new Date(sub.expiryDate).toLocaleDateString("en-IN")}. Contact support to renew.`,
        subscriptionExpired: true
      });
    }

    // ⭐ GET OWNER USER
const ownerUser = await prisma.user.findFirst({
  where: { companyId: company.id, role: "OWNER" }
});

const token = jwt.sign(
  {
    companyId: company.id,
    userId: ownerUser?.id,
    role: ownerUser?.role || "OWNER"
  },
  process.env.JWT_SECRET,
  { expiresIn: "7d" }
);

    // ⭐ SEND SUBSCRIPTION INFO WITH RESPONSE
    const { password: _, ...companyData } = company;

    res.json({
      token,
      company: companyData,
      subscription: {
        plan: sub.plan,
        status: sub.status,
        expiryDate: sub.expiryDate,
        daysLeft: Math.ceil(
          (new Date(sub.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)
        )
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};