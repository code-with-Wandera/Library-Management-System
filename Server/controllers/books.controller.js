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
    // Added projection to only get what the UI actually needs
    const books = await Book.find()
      .populate("borrowedBy", "firstName lastName email")
      .sort({ createdAt: -1 })
      .lean(); 

    res.status(200).json(books);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch books" });
  }
};

/** POST /books - Atomic Issue Logic */
export const issueBook = async (req, res) => {
  const { id } = req.params;
  const { memberId, days = 14 } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id) || !memberId) {
    return res.status(400).json({ message: "Valid Book ID and Member ID required" });
  }

  try {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + parseInt(days));

    // ATOMIC UPDATE: Prevents double-issuing
    const book = await Book.findOneAndUpdate(
      { _id: id, status: "available" }, 
      { 
        $set: { 
          status: "issued", 
          borrowedBy: memberId, 
          dueDate: dueDate 
        } 
      },
      { new: true, runValidators: true }
    ).populate("borrowedBy", "firstName lastName");

    if (!book) {
      return res.status(400).json({ message: "Book is either unavailable or does not exist" });
    }

    res.status(200).json(book);
  } catch (err) {
    res.status(500).json({ message: "Database error during issuance" });
  }
};

/** POST /books/:id/return */
export const returnBook = async (req, res) => {
  const { id } = req.params;

  try {
    const book = await Book.findById(id).populate("borrowedBy");
    
    if (!book || book.status === "available") {
      return res.status(404).json({ message: "Book not found or already returned" });
    }

    const fine = calculateFine(book.dueDate);
    const borrower = book.borrowedBy;

    // Reset Book Status
    book.status = "available";
    book.borrowedBy = null;
    book.dueDate = null;
    await book.save();

    // PRODUCTION STEP: If there is a fine, update the Member's record permanently
    if (fine > 0 && borrower) {
      await mongoose.model("Member").findByIdAndUpdate(borrower._id, {
        $inc: { totalFines: fine }
      });
    }

    res.status(200).json({ 
      message: fine > 0 ? `Returned with $${fine} fine` : "Returned successfully", 
      book,
      fine,
      borrower: borrower ? `${borrower.firstName} ${borrower.lastName}` : "Unknown"
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to process return" });
  }
};