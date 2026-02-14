import mongoose from "mongoose";
import Borrow from "../models/borrow.model.js";
import Book from "../models/book.model.js";
import Member from "../models/members.model.js";
import Transaction from "../models/transactions.model.js";

/**
 * @desc    Issue a book (Checkout)
 * Logic: Updates book.status to "issued" and sets book.borrowedBy
 */
export const borrowBook = async (req, res) => {
  const { memberId, bookId, dueDate } = req.body;
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const book = await Book.findById(bookId).session(session);
    if (!book) throw new Error("Book not found.");
    
    // Check against your specific "status" enum
    if (book.status !== "available") {
      throw new Error(`Book is currently ${book.status}`);
    }

    // 1. Create Borrow Record
    const newLoan = await Borrow.create([{
      memberId,
      bookId,
      dueDate: new Date(dueDate),
      status: "borrowed"
    }], { session });

    // 2. Update Book to match your Schema fields
    book.status = "issued";
    book.borrowedBy = memberId; // Sets the field for your virtual "isBorrowed"
    book.dueDate = new Date(dueDate);
    await book.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ success: true, loan: newLoan[0] });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ success: false, error: err.message });
  }
};

/**
 * @desc    Return a book
 * Logic: Resets book.status to "available" and clears book.borrowedBy
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

    if (today > dueDate) {
      const diffDays = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));
      fineAmount = diffDays * 0.50;

      // Update Member totalFines (matching your schema)
      await Member.findByIdAndUpdate(
        loan.memberId, 
        { $inc: { totalFines: fineAmount } },
        { session }
      );

      await Transaction.create([{
        memberId: loan.memberId,
        type: "fine_incurred",
        amount: fineAmount,
        description: `Overdue: ${diffDays} days.`
      }], { session });
    }

    // 3. Update Loan
    loan.status = "returned";
    loan.returnDate = today;
    await loan.save({ session });

    // 4. Reset Book (Matching your Schema)
    await Book.findByIdAndUpdate(
      loan.bookId, 
      { 
        status: "available", 
        borrowedBy: null, // Clears the virtual "isBorrowed"
        dueDate: null 
      },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.json({ success: true, fineIncurred: fineAmount });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ success: false, error: err.message });
  }
};