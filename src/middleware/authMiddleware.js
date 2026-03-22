import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";

export const authMiddleware = async (req, res, next) => {
  try {
    let token = null;

    const authHeader = req.headers.authorization;
    if (authHeader) token = authHeader.split(" ")[1];
    if (!token && req.query.token) token = req.query.token;

    if (!token) return res.status(401).json({ message: "No token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.companyId = decoded.companyId;
    req.userId = decoded.userId;
    req.role = decoded.role || "OWNER";

    // ⭐ Fetch user name for activity logging
    // ⭐ Fetch user name for activity logging
if (decoded.userId) {
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { name: true, email: true }
  });
  req.userName = (user?.name && user.name.trim() !== "")
    ? user.name
    : user?.email || "Unknown";
}

    next();

  } catch (err) {
    console.log("JWT ERROR:", err.message);
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.role)) {
      return res.status(403).json({
        message: `Access denied. Required role: ${roles.join(" or ")}`
      });
    }
    next();
  };
};