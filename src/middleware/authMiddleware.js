import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";

export const authMiddleware = (req, res, next) => {
  try {

    let token = null;

    /* ⭐ NORMAL API TOKEN */
    const authHeader = req.headers.authorization;
    if (authHeader) {
      token = authHeader.split(" ")[1];
    }

    /* ⭐ PDF TOKEN (QUERY PARAM) */
    if (!token && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({ message: "No token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.companyId = decoded.companyId;
    req.userId = decoded.userId;
    req.role = decoded.role || "OWNER";

    next();

  } catch (err) {
    console.log("JWT ERROR:", err.message);
    return res.status(401).json({ message: "Unauthorized" });
  }
};

/* ================= ROLE MIDDLEWARE ================= */

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