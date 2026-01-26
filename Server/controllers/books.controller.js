// src/controllers/books.controller.js
import Book from "../models/books.model.js";
import mongoose from "mongoose";

/** GET /books - fetch all books */
export const getBooks = async (req, res) => {
  try {
    const books = await Book.find().populate({
      path: "borrowedBy",
      select: "name email", // return only necessary fields
    });
    res.status(200).json(books);
  } catch (err) {
    console.error("Error fetching books:", err);
    res.status(500).json({ message: "Failed to fetch books" });
  }
};

/** POST /books - add a new book */
export const addBook = async (req, res) => {
  const { title, author } = req.body;

  if (!title?.trim() || !author?.trim()) {
    return res.status(400).json({ message: "Title and author are required" });
  }

  try {
    const newBook = new Book({ title: title.trim(), author: author.trim() });
    await newBook.save();
    res.status(201).json(newBook);
  } catch (err) {
    console.error("Error adding book:", err);
    res.status(500).json({ message: "Failed to add book" });
  }
};

/** PUT /books/:id - update book info */
export const updateBook = async (req, res) => {
  const { id } = req.params;
  const { title, author } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id))
    return res.status(400).json({ message: "Invalid book ID" });

  if (!title?.trim() || !author?.trim())
    return res.status(400).json({ message: "Title and author are required" });

  try {
    const updatedBook = await Book.findByIdAndUpdate(
      id,
      { title: title.trim(), author: author.trim() },
      { new: true, runValidators: true }
    ).populate({ path: "borrowedBy", select: "name email" });

    if (!updatedBook)
      return res.status(404).json({ message: "Book not found" });

    res.status(200).json(updatedBook);
  } catch (err) {
    console.error("Error updating book:", err);
    res.status(500).json({ message: "Failed to update book" });
  }
};

/** DELETE /books/:id - delete book */
export const deleteBook = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id))
    return res.status(400).json({ message: "Invalid book ID" });

  try {
    const deleted = await Book.findByIdAndDelete(id);
    if (!deleted)
      return res.status(404).json({ message: "Book not found" });

    res.status(200).json({ message: "Book deleted successfully" });
  } catch (err) {
    console.error("Error deleting book:", err);
    res.status(500).json({ message: "Failed to delete book" });
  }
};

/** PUT /books/:id/toggle-borrow - borrow or return book */
export const toggleBorrowBook = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id))
    return res.status(400).json({ message: "Invalid book ID" });

  if (!req.user || !req.user._id)
    return res.status(401).json({ message: "Unauthorized" });

  try {
    const book = await Book.findById(id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    // toggle borrow/return
    if (book.isBorrowed) {
      book.borrowedBy = null; // return
    } else {
      book.borrowedBy = req.user._id; // borrow
    }

    await book.save();
    await book.populate({ path: "borrowedBy", select: "name email" });

    res.status(200).json(book);
  } catch (err) {
    console.error("Error toggling borrow:", err);
    res.status(500).json({ message: "Failed to update borrow status" });
  }
};
