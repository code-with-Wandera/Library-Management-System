// Server/routes/auth.routes.js
import express from "express";
import jwt from "jsonwebtoken";

const router = express.Router();

// Dummy users for testing
const users = [
  { id: "1", email: "admin@test.com", password: "admin123", role: "admin" },
  { id: "2", email: "user@test.com", password: "user123", role: "user" },
];

// POST /api/auth/login
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || "secret123",
    { expiresIn: "1d" }
  );

  res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
});

export default router;
