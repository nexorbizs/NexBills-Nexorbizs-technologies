import prisma from "../config/prisma.js";
import bcrypt from "bcryptjs";

/* ================= GET ALL USERS ================= */
export const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { companyId: req.companyId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        branches: {
          include: { branch: true } // ⭐ include branch details
        }
      },
      orderBy: { id: "asc" }
    });

    // Flatten so frontend gets user.branches = [{ id, name, ... }]
    const mapped = users.map(u => ({
      ...u,
      branches: u.branches.map(ub => ub.branch)
    }));

    res.json(mapped);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= CREATE USER ================= */
export const createUser = async (req, res) => {
  try {
    const { email, password, name, role, branchIds = [] } = req.body;

    if (!email || !password || !name || !role)
      return res.status(400).json({ error: "All fields required" });

    if (!["MANAGER", "CASHIER"].includes(role))
      return res.status(400).json({ error: "Invalid role. Use MANAGER or CASHIER" });

    // CHECK SUBSCRIPTION USER LIMIT
    const subscription = await prisma.subscription.findUnique({
      where: { companyId: req.companyId }
    });

    const userCount = await prisma.user.count({
      where: { companyId: req.companyId }
    });

    if (subscription && userCount >= subscription.maxUsers)
      return res.status(400).json({
        error: `User limit reached (${subscription.maxUsers}). Upgrade your plan.`
      });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing)
      return res.status(400).json({ error: "Email already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        name,
        role,
        companyId: req.companyId,
        branches: {
          create: branchIds.map(id => ({ branchId: Number(id) })) // ⭐ assign branches
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        branches: {
          include: { branch: true }
        }
      }
    });

    res.json({
      ...user,
      branches: user.branches.map(ub => ub.branch)
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= UPDATE USER BRANCHES ================= */ // ⭐ NEW
export const updateUserBranches = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { branchIds = [] } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || user.companyId !== req.companyId)
      return res.status(404).json({ error: "User not found" });

    // Delete existing assignments and recreate
    await prisma.userBranch.deleteMany({ where: { userId: id } });

    await prisma.userBranch.createMany({
      data: branchIds.map(bid => ({
        userId: id,
        branchId: Number(bid)
      }))
    });

    const updated = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        branches: {
          include: { branch: true }
        }
      }
    });

    res.json({
      ...updated,
      branches: updated.branches.map(ub => ub.branch)
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= TOGGLE USER ACTIVE ================= */
export const toggleUser = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const user = await prisma.user.findUnique({ where: { id } });

    if (!user || user.companyId !== req.companyId)
      return res.status(404).json({ error: "User not found" });

    if (user.role === "OWNER")
      return res.status(400).json({ error: "Cannot disable owner" });

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        branches: {
          include: { branch: true }
        }
      }
    });

    res.json({
      ...updated,
      branches: updated.branches.map(ub => ub.branch)
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= DELETE USER ================= */
export const deleteUser = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const user = await prisma.user.findUnique({ where: { id } });

    if (!user || user.companyId !== req.companyId)
      return res.status(404).json({ error: "User not found" });

    if (user.role === "OWNER")
      return res.status(400).json({ error: "Cannot delete owner" });

    await prisma.user.delete({ where: { id } });

    res.json({ message: "User deleted" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= STAFF LOGIN ================= */
export const staffLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        company: {
          include: { subscription: true }
        },
        branches: {
          include: { branch: true }
        }
      }
    });

    if (!user)
      return res.status(400).json({ message: "User not found" });

    if (!user.isActive)
      return res.status(403).json({ message: "Account disabled. Contact your owner." });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(400).json({ message: "Invalid password" });

    const sub = user.company.subscription;

    if (!sub || sub.status === "suspended")
      return res.status(403).json({
        message: "Company subscription suspended. Contact support.",
        subscriptionExpired: true
      });

    if (new Date() > new Date(sub.expiryDate))
      return res.status(403).json({
        message: "Company subscription expired. Contact support.",
        subscriptionExpired: true
      });

    const jwt = await import("jsonwebtoken");
    const token = jwt.default.sign(
      {
        companyId: user.companyId,
        userId: user.id,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      company: user.company,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        branches: user.branches.map(ub => ub.branch) // ⭐ include branches in login response
      },
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