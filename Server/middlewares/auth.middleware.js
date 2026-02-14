import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

/**
 * Protect routes - user must be logged in
 */
export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Defensive: ensure decoded.id is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(decoded.id)) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    // Fetch user and ensure we are not excluding tenantId or other vital fields
    const user = await User.findById(decoded.id).select("-password");
    
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Attach full user document to request. 
    // This ensures req.user.tenantId is available for your Audit Logs.
    req.user = user; 
    
    next();
  } catch (err) {
    console.error("JWT verification failed:", err.message);
    return res.status(401).json({ message: "Token invalid" });
  }
};

/**
 * Admin-only middleware (backward compatible)
 */
export const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin only" });
  }
  next();
};

/**
 * Flexible role-based authorization
 * Usage: authorize("admin", "staff")
 */
export const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
};

// Alias for existing routes using 'verifyToken'
export const verifyToken = protect;