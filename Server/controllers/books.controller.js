import Book from "../models/books.model.js";
import mongoose from "mongoose";
import Transaction from "../models/transactions.model.js";

// calculates fine after 3 weeks then $1 will be added every 2 days
const calculateFine = (dueDate) => {
  if (!dueDate) return 0;

  const now = new Date();
  const due = new Date(dueDate);

  // 1. Define the 3-week (21 days) Grace Period
  const gracePeriodMS = 21 * 24 * 60 * 60 * 1000;
  const fineStartsAt = due.getTime() + gracePeriodMS;

  // 2. Check if we have actually passed that "Fine Start" date
  if (now.getTime() > fineStartsAt) {
    // Calculate total days elapsed since the grace period ended
    const diffTime = now.getTime() - fineStartsAt;
    const totalDaysOverdue = Math.ceil(
      diffTime / (1000 * 60 * 60 * 24)
    );

    // 3. Apply the "$1 every 2 days" rule
    const fineAmount = Math.ceil(totalDaysOverdue / 2);
    return fineAmount;
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
      isbn: isbn?.trim(),
    });

    await newBook.save();
    res.status(201).json(newBook);
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(400)
        .json({ message: "ISBN or Title already exists." });
    }
    res.status(500).json({ message: "Failed to add book" });
  }
};

/** PUT /books/:id - update book info */
export const updateBook = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid book ID" });
  }

  try {
    const updatedBook = await Book.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate("borrowedBy", "firstName lastName email");

    if (!updatedBook) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.status(200).json(updatedBook);
  } catch (err) {
    res.status(500).json({ message: "Failed to update book" });
  }
};

/** DELETE /books/:id */
export const deleteBook = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid book ID" });
  }

  try {
    const deleted = await Book.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Book not found" });
    }
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
      {
        $set: {
          status: "issued",
          borrowedBy: memberId,
          dueDate: dueDate,
        },
      },
      { new: true }
    ).populate("borrowedBy", "firstName lastName");

    if (!book) {
      return res.status(400).json({ message: "Book unavailable" });
    }

    res.status(200).json(book);
  } catch (err) {
    res.status(500).json({ message: "Error issuing book" });
  }
};

/** POST /books/:id/return */
export const returnBook = async (req, res) => {
  const { borrowId } = req.body; 

  try {
    const record = await Borrow.findById(borrowId);
    if (!record) return res.status(404).json({ message: "Record not found" });

    const today = new Date();
    const dueDate = new Date(record.dueDate);
    
    // 1. Calculate Days Late
    const diffTime = today - dueDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    let fineApplied = 0;
    const DAILY_RATE = 0.50; // $0.50 per day

    if (diffDays > 0) {
      fineApplied = diffDays * DAILY_RATE;

      // 2. Update the Member's balance
      await Member.findByIdAndUpdate(record.memberId, {
        $inc: { totalFines: fineApplied }
      });

      // 3. Create a Transaction Log for the audit trail
      await Transaction.create({
        memberId: record.memberId,
        type: "fine_incurred",
        amount: fineApplied,
        description: `Late return: ${record.bookTitle} (${diffDays} days late)`
      });
    }

    // 4. Mark the book as returned
    record.returnDate = today;
    record.status = "returned";
    await record.save();

    res.status(200).json({ 
      message: "Book returned", 
      fine: fineApplied 
    });
  } catch (err) {
    res.status(500).json({ error: "Return failed" });
  }
};