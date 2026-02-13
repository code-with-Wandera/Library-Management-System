import mongoose from "mongoose";
import dotenv from "dotenv";
import Book from "../models/books.model.js";
import connectDB from "../config/db.config.js";

import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

const genres = ["science", "history", "mathematics", "fiction", "biography", "technology"];
const levels = ["Primary", "Secondary", "College", "University", "Non-academic"];

const seedBooks = async () => {
  try {
    await connectDB();
    
    // Clear existing books to start fresh
    await Book.deleteMany({});
    console.log("Old books cleared.");

    const booksToInsert = [];

    for (let i = 1; i <= 100; i++) {
      booksToInsert.push({
        title: `Library Volume ${i}: ${['Deep Dive', 'Fundamentals', 'Advanced Theory', 'Introduction'][i % 4]}`,
        author: `Author ${Math.ceil(i / 5)}`,
        isbn: `978-3-16-148${i.toString().padStart(3, '0')}-0`,
        genre: genres[Math.floor(Math.random() * genres.length)],
        academicLevel: levels[Math.floor(Math.random() * levels.length)],
        status: "available",
      });
    }

    await Book.insertMany(booksToInsert);
    console.log(`Successfully seeded 100 books!`);
    process.exit();
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
};

seedBooks();