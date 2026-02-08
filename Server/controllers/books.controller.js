// src/controllers/books.controller.js
import Book from "../models/books.model.js";
import mongoose from "mongoose";

/** * Helper: Calculate fines based on due date
 * Example: $1 per day overdue
 */
const calculateFine = (dueDate) => {
  const now = new Date();
  const due = new Date(dueDate);
  if (now > due) {
    const diffTime = Math.abs(now - due);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays * 1; // $1 per day
  }
  return 0;
};

/** GET /books - fetch all books */
export const getBooks = async (req, res) => {
  try {
    const books = await Book.find().populate({
      path: "borrowedBy",
      select: "name email",
    });
    res.status(200).json(books);
  } catch (err) {
    console.error("Error fetching books:", err);
    res.status(500).json({ message: "Failed to fetch books" });
  }
};

/** POST /books - add a new book with Categories & Academic Levels */
export const addBook = async (req, res) => {
  const { title, author, genre, isAcademic, academicLevel } = req.body;

  if (!title?.trim() || !author?.trim()) {
    return res.status(400).json({ message: "Title and author are required" });
  }

  try {
    const newBook = new Book({
      title: title.trim(),
      author: author.trim(),
      genre: genre || "General",
      isAcademic: isAcademic || false,
      // Levels: Primary, Secondary, College, University
      academicLevel: academicLevel || "Non-academic", 
      status: "available"
    });

    await newBook.save();
    res.status(201).json(newBook);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ 
        message: `The book title "${title}" already exists.` 
      });
    }
    res.status(500).json({ message: "Failed to add book" });
  }
};

/** PUT /books/:id - update book info */
export const updateBook = async (req, res) => {
  const { id } = req.params;
  const { title, author, genre, isAcademic, academicLevel } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id))
    return res.status(400).json({ message: "Invalid book ID" });

  try {
    const updatedBook = await Book.findByIdAndUpdate(
      id,
      { 
        title: title?.trim(), 
        author: author?.trim(),
        genre,
        isAcademic,
        academicLevel
      },
      { new: true, runValidators: true }
    ).populate({ path: "borrowedBy", select: "name email" });

    if (!updatedBook) return res.status(404).json({ message: "Book not found" });

    res.status(200).json(updatedBook);
  } catch (err) {
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
    if (!deleted) return res.status(404).json({ message: "Book not found" });

    res.status(200).json({ message: "Book deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete book" });
  }
};

/** PUT /books/:id/toggle-borrow - Issue or Return logic with Fines */
export const toggleBorrowBook = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id))
    return res.status(400).json({ message: "Invalid book ID" });

  if (!req.user || !req.user._id)
    return res.status(401).json({ message: "Unauthorized" });

  try {
    const book = await Book.findById(id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    let message = "";

    // LOGIC: RETURN BOOK
    if (book.borrowedBy && book.borrowedBy.toString() === req.user._id.toString()) {
      const fine = calculateFine(book.dueDate);
      
      book.status = "returned";
      book.returnDate = new Date();
      book.borrowedBy = null; // Mark as available again
      
      message = fine > 0 
        ? `Book returned. Overdue fine: $${fine}` 
        : "Book returned successfully.";
    } 
    // LOGIC: ISSUE BOOK
    else if (!book.borrowedBy) {
      book.borrowedBy = req.user._id;
      book.status = "issued";
      book.issueDate = new Date();
      
      // Set due date to 14 days from now
      const due = new Date();
      due.setDate(due.getDate() + 14);
      book.dueDate = due;
      
      message = "Book issued successfully. Due in 14 days.";
    } 
    else {
      return res.status(400).json({ message: "Book is already issued to someone else" });
    }

    await book.save();
    await book.populate({ path: "borrowedBy", select: "name email" });

    res.status(200).json({ message, book });
  } catch (err) {
    console.error("Error toggling borrow:", err);
    res.status(500).json({ message: "Failed to process transaction" });
  }
};