import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/user.model.js";

const DB_URI = process.env.MONGO_URI || "mongodb://localhost:27017/library_db";

async function seedAdmin() {
  await mongoose.connect(DB_URI);

  const email = "admin@test.com";

  const existing = await User.findOne({ email });
  if (existing) {
    console.log("Admin already exists");
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash("Admin123", 10);

  const admin = await User.create({
    name: "System Admin",
    email,
    password: hashedPassword,
    role: "admin",
  });

  console.log("Admin created:");
  console.log({
    email: admin.email,
    password: "Admin123",
  });

  process.exit(0);
}

seedAdmin();
