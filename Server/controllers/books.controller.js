import Book from "../models/books.model.js";
import mongoose from "mongoose";
import Transaction from "../models/transactions.model.js";
import { logAudit } from "../utils/auditLog.utils.js"; // Injected dependency

// calculates fine after 3 weeks then $1 will be added every 2 days
const calculateFine = (dueDate) => {
  if (!dueDate) return 0;

  const now = new Date();
  const due = new Date(dueDate);

  const gracePeriodMS = 21 * 24 * 60 * 60 * 1000;
  const fineStartsAt = due.getTime() + gracePeriodMS;

  if (now.getTime() > fineStartsAt) {
    const diffTime = now.getTime() - fineStartsAt;
    const totalDaysOverdue = Math.ceil(
      diffTime / (1000 * 60 * 60 * 24)
    );

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
      tenantId: req.user.tenantId, // Ensure multi-tenancy
    });

    await newBook.save();

    // LOG CAPTURE: ADD_BOOK
    await logAudit(req, {
      action: "ADD_BOOK",
      resource: "Inventory",
      targetId: newBook._id,
      details: `Added new book: "${title}" by ${author}`,
    });

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

    // LOG CAPTURE: UPDATE_BOOK
    await logAudit(req, {
      action: "UPDATE_BOOK",
      resource: "Inventory",
      targetId: updatedBook._id,
      details: `Updated details for: "${updatedBook.title}"`,
    });

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

    // LOG CAPTURE: DELETE_BOOK
    await logAudit(req, {
      action: "DELETE_BOOK",
      resource: "Inventory",
      targetId: id,
      details: `Deleted book: "${deleted.title}"`,
    });

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

    // LOG CAPTURE: ISSUE_BOOK
    await logAudit(req, {
      action: "ISSUE_BOOK",
      resource: "Circulation",
      targetId: book._id,
      details: `Issued "${book.title}" to member: ${book.borrowedBy?.firstName} ${book.borrowedBy?.lastName}`,
    });

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

    const diffTime = today - dueDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let fineApplied = 0;
    const DAILY_RATE = 0.5; // $0.50 per day

    if (diffDays > 0) {
      fineApplied = diffDays * DAILY_RATE;

      await Member.findByIdAndUpdate(record.memberId, {
        $inc: { totalFines: fineApplied },
      });

      await Transaction.create({
        memberId: record.memberId,
        type: "fine_incurred",
        amount: fineApplied,
        description: `Late return: ${record.bookTitle} (${diffDays} days late)`,
      });
    }

    record.returnDate = today;
    record.status = "returned";
    await record.save();

    // LOG CAPTURE: RETURN_BOOK
    await logAudit(req, {
      action: "RETURN_BOOK",
      resource: "Circulation",
      targetId: record.bookId,
      details: `Returned book: "${record.bookTitle}". Fine: $${fineApplied}`,
    });

    res.status(200).json({
      message: "Book returned",
      fine: fineApplied,
    });
  } catch (err) {
    res.status(500).json({ error: "Return failed" });
  }
};