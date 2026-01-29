import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/user.model.js";

const DB_URI = process.env.MONGO_URI;

const adminData = {
  name: "Admin",
  email: "admin@example.com",
  password: "StrongAdmin!2026", // change immediately after first login
  role: "admin",
};

async function seedAdmin() {
  await mongoose.connect(DB_URI);
  const hashedPassword = await bcrypt.hash(adminData.password, 10);

  let admin = await User.findOne({ email: adminData.email });
  if (admin) {
    admin.password = hashedPassword;
    admin.role = "admin";
    await admin.save();
    console.log("Admin password reset!");
  } else {
    admin.password = hashedPassword;
    await User.create(adminData);
    console.log("Admin created!");
  }

  process.exit(0);
}

seedAdmin();
