import jwt from "jsonwebtoken";

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

    next();

  } catch (err) {
    console.log("JWT ERROR:", err.message);
    return res.status(401).json({ message: "Unauthorized" });
  }
};