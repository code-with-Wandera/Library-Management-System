import Book from "../models/books.model.js";
import mongoose from "mongoose";

// Helper: Calculate fines ($1 per day overdue)
const calculateFine = (dueDate) => {
  if (!dueDate) return 0;
  const now = new Date();
  const due = new Date(dueDate);
  if (now > due) {
    const diffTime = Math.abs(now - due);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  }
  return 0;
};

/** GET /books - fetch all books */
export const getBooks = async (req, res) => {
  try {
    const books = await Book.find()
      .populate("borrowedBy", "firstName lastName email")
      .sort({ createdAt: -1 })
      .lean(); 
    res.status(200).json(books);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch books" });
  }
};

/** POST /books - add a new book */
export const addBook = async (req, res) => {
  const { title, author, genre, academicLevel, isbn } = req.body;

  if (!title?.trim() || !author?.trim()) {
    return res.status(400).json({ message: "Title and Author are required" });
  }

  try {
    const newBook = new Book({
      title: title.trim(),
      author: author.trim(),
      genre: genre?.toLowerCase().trim() || "general",
      academicLevel: academicLevel || "Non-academic",
      isbn: isbn?.trim()
    });

    await newBook.save();
    res.status(201).json(newBook);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "ISBN or Title already exists." });
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
      { $set: req.body }, 
      { new: true, runValidators: true }
    ).populate("borrowedBy", "firstName lastName email");

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

/** POST /books/:id/issue - Atomic Issue */
export const issueBook = async (req, res) => {
  const { id } = req.params;
  const { memberId, days = 14 } = req.body;

  try {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + parseInt(days));

    const book = await Book.findOneAndUpdate(
      { _id: id, status: "available" }, 
      { $set: { status: "issued", borrowedBy: memberId, dueDate: dueDate } },
      { new: true }
    ).populate("borrowedBy", "firstName lastName");

    if (!book) return res.status(400).json({ message: "Book unavailable" });
    res.status(200).json(book);
  } catch (err) {
    res.status(500).json({ message: "Error issuing book" });
  }
};

/** POST /books/:id/return */
export const returnBook = async (req, res) => {
  const { id } = req.params;
  try {
    const book = await Book.findById(id).populate("borrowedBy");
    if (!book || book.status === "available") 
      return res.status(404).json({ message: "Book not found or already in library" });

    const fine = calculateFine(book.dueDate);
    const borrower = book.borrowedBy;

    book.status = "available";
    book.borrowedBy = null;
    book.dueDate = null;
    await book.save();

    if (fine > 0 && borrower) {
      await mongoose.model("Member").findByIdAndUpdate(borrower._id, { $inc: { totalFines: fine } });
    }

    res.status(200).json({ message: "Returned successfully", book, fine });
  } catch (err) {
    res.status(500).json({ message: "Failed to return book" });
  }
};