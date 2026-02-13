import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Member from "../models/members.model.js";
import connectDB from "../config/db.config.js";

// Fix for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly point to the .env file in the Server root
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const seedMembers = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI not defined in environment variables");
    }

    await connectDB();
    
    // 1. Clear existing members
    await Member.deleteMany({});
    console.log(" Old members cleared.");

    const membersToInsert = [];
    const statuses = ["active", "inactive", "suspended"];
    const classes = ["Class A", "Class B", "Class C", "Class D", "Staff"];

    // 2. Generate 1,000 members
    for (let i = 1; i <= 1000; i++) {
      membersToInsert.push({
        firstName: `User${i}`,
        lastName: `Test${i}`,
        email: `member${i}@libsys.com`,
        studentId: `STU-${1000 + i}`,
        class: classes[Math.floor(Math.random() * classes.length)],
        status: i % 50 === 0 ? "suspended" : "active", // Every 50th member is suspended
        totalFines: i % 10 === 0 ? Math.floor(Math.random() * 50) : 0, // Some have fines
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)), // Random dates for growth chart
      });
    }

    // 3. Bulk Insert for performance
    await Member.insertMany(membersToInsert);
    console.log(" Successfully seeded 1,000 members!");
    
    process.exit();
  } catch (error) {
    console.error("Seeding failed:", error.message);
    process.exit(1);
  }
};

seedMembers();