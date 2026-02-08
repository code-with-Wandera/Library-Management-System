import Book from "../models/books.model.js";
import mongoose from "mongoose";

/** * Helper: Calculate fines based on due date
 * $1 per day overdue
 */
const calculateFine = (dueDate) => {
  if (!dueDate) return 0;
  const now = new Date();
  const due = new Date(dueDate);
  if (now > due) {
    const diffTime = Math.abs(now - due);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays * 1; 
  }
  return 0;
};

/** GET /books - fetch all books */
export const getBooks = async (req, res) => {
  try {
    const books = await Book.find()
      .populate({
        path: "borrowedBy",
        select: "firstName lastName email", // Changed 'name' to 'firstName lastName' to match your Member model
      })
      .lean(); // Faster performance
    res.status(200).json(books);
  } catch (err) {
    console.error("Error fetching books:", err);
    res.status(500).json({ message: "Failed to fetch books" });
  }
};

/** POST /books - add a new book */
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
      academicLevel: academicLevel || "Non-academic", 
      status: "available"
    });

    await newBook.save();
    res.status(201).json(newBook);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: `The book title "${title}" already exists.` });
    }
    res.status(500).json({ message: "Failed to add book" });
  }
};

/** PUT /books/:id - update book info */
export const updateBook = async (req, res) => {
  const { id } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(id))
    return res.status(400).json({ message: "Invalid book ID" });

  try {
    const updatedBook = await Book.findByIdAndUpdate(
      id,
      { $set: req.body }, // Dynamic update
      { new: true, runValidators: true }
    ).populate({ path: "borrowedBy", select: "firstName lastName email" });

    if (!updatedBook) return res.status(404).json({ message: "Book not found" });

    res.status(200).json(updatedBook);
  } catch (err) {
    res.status(500).json({ message: "Failed to update book" });
  }
};

/** DELETE /books/:id */
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

/** POST /books/:id/issue */
export const issueBook = async (req, res) => {
  const { id } = req.params;
  const { memberId, days = 14 } = req.body;

  try {
    const book = await Book.findById(id);
    if (!book) return res.status(404).json({ message: "Book not found" });
    if (book.status === "issued") return res.status(400).json({ message: "Book already issued" });

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + parseInt(days));

    book.borrowedBy = memberId;
    book.status = "issued";
    book.dueDate = dueDate;

    await book.save();
    res.status(200).json(book);
  } catch (err) {
    res.status(500).json({ message: "Failed to issue book" });
  }
};

/** POST /books/:id/return */
export const returnBook = async (req, res) => {
  const { id } = req.params;

  try {
    const book = await Book.findById(id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    const fine = calculateFine(book.dueDate);

    book.borrowedBy = null;
    book.status = "available";
    book.dueDate = null;

    await book.save();
    res.status(200).json({ 
      message: fine > 0 ? `Book returned. Fine: $${fine}` : "Book returned successfully", 
      book,
      fine 
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to return book" });
  }
};