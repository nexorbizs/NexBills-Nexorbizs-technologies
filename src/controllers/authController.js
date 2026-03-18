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
      data: {
        name,
        email,
        password: hashed
      }
    });

    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        role: "OWNER",
        companyId: newCompany.id
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
      where: { email }
    });

    if (!company)
      return res.status(400).json({ message: "Company not found" });

    const match = await bcrypt.compare(password, company.password);

    if (!match)
      return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign(
      { companyId: company.id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, company });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};