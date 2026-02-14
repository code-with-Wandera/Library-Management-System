export const returnBook = async (req, res) => {
  const { borrowId } = req.params;

  try {
    const loan = await Borrow.findById(borrowId);
    if (!loan || loan.status === "returned") {
      return res.status(400).json({ error: "Invalid or already returned loan." });
    }

    const today = new Date();
    const dueDate = new Date(loan.dueDate);
    let fineAmount = 0;

    // 1. Calculate Late Fees
    if (today > dueDate) {
      const diffTime = Math.abs(today - dueDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const DAILY_RATE = 0.50; // Set your rate here
      fineAmount = diffDays * DAILY_RATE;

      // 2. Inject Fine into Member's Account
      await Member.findByIdAndUpdate(loan.memberId, {
        $inc: { totalFines: fineAmount }
      });

      // 3. Create a Transaction Record for the Ledger we built
      await Transaction.create({
        memberId: loan.memberId,
        type: "fine_incurred",
        amount: fineAmount,
        description: `Late return: ${diffDays} days overdue.`
      });
    }

    // 4. Update Loan and Book Status
    loan.status = "returned";
    loan.returnDate = today;
    await loan.save();

    // Mark book as available again
    await Book.findByIdAndUpdate(loan.bookId, { available: true });

    res.json({ message: "Book returned", fineIncurred: fineAmount });
  } catch (err) {
    res.status(500).json({ error: "Server error during return." });
  }
};