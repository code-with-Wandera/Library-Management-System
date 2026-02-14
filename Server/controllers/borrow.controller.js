import mongoose from "mongoose";
import Borrow from "../models/borrow.model.js";
import Book from "../models/books.model.js";
import Member from "../models/members.model.js";
import Transaction from "../models/transactions.model.js";
import { createAuditLog } from "../utils/auditLogger.utils.js";

/**
 * @desc    Issue a book to a member (Checkout)
 * @route   POST /api/borrow
 */
export const borrowBook = async (req, res) => {
  const { memberId, bookId, dueDate } = req.body;
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    if (!memberId || !bookId || !dueDate) {
      throw new Error("Member ID, Book ID, and Due Date are required.");
    }

    // Check if Member exists
    const member = await Member.findById(memberId).session(session);
    if (!member) throw new Error("Member not found.");

    // Check if Book is available
    const book = await Book.findById(bookId).session(session);
    if (!book) throw new Error("Book not found.");
    if (!book.available) throw new Error("This book is already checked out.");

    // 1. Create the Borrow Record
    const newLoan = await Borrow.create([{
      memberId,
      bookId,
      dueDate: new Date(dueDate),
      status: "borrowed"
    }], { session });

    // 2. Update Book Status to Unavailable
    book.available = false;
    await book.save({ session });

    await session.commitTransaction();
    session.endSession();

    await createAuditLog(req, {
      action:"ISSUE_BOOKS",
      resource: "Books",
      details: `Book ${bookId} issued to membere ${memberId}`,
      payload: {bookId, memberId, dueDate}
    })

    res.status(201).json({
      success: true,
      message: "Book issued successfully",
      loan: newLoan[0]
    });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ success: false, error: err.message });
  }
};

/**
 * @desc    Return a book and calculate fines
 * @route   PATCH /api/borrow/return/:borrowId
 */
export const returnBook = async (req, res) => {
  const { borrowId } = req.params;
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const loan = await Borrow.findById(borrowId).session(session);
    if (!loan || loan.status === "returned") {
      throw new Error("Invalid or already returned loan.");
    }

    const today = new Date();
    const dueDate = new Date(loan.dueDate);
    let fineAmount = 0;

    // 1. Calculate Late Fees
    if (today > dueDate) {
      const diffTime = today - dueDate;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const DAILY_RATE = 0.50; 
      fineAmount = diffDays * DAILY_RATE;

      // Update Member Balance
      await Member.findByIdAndUpdate(
        loan.memberId, 
        { $inc: { totalFines: fineAmount } },
        { session }
      );

      // Create Financial Transaction Record for the Ledger
      await Transaction.create([{
        memberId: loan.memberId,
        type: "fine_incurred",
        amount: fineAmount,
        description: `Late return: ${diffDays} day(s) overdue.`
      }], { session });
    }

    // 2. Update Loan Status
    loan.status = "returned";
    loan.returnDate = today;
    await loan.save({ session });

    // 3. Update Book Availability
    const updatedBook = await Book.findByIdAndUpdate(
      loan.bookId, 
      { available: true },
      { session, new: true }
    );

    if (!updatedBook) throw new Error("Associated book record not found.");

    await session.commitTransaction();
    session.endSession();

    res.json({ 
      success: true,
      message: "Book returned successfully", 
      fineIncurred: fineAmount 
    });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ success: false, error: err.message });
  }
};

/**
 * @desc    Get all currently borrowed books
 * @route   GET /api/borrow/active
 */
export const getActiveLoans = async (req, res) => {
  try {
    const loans = await Borrow.find({ status: "borrowed" })
      .populate("bookId", "title isbn")
      .populate("memberId", "firstName lastName")
      .sort({ dueDate: 1 }); // Show soonest due first
    
    res.json(loans);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch active loans" });
  }
};