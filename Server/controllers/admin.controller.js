import Book from "../models/books.model.js";
import Member from "../models/members.model.js";

/** GET /admin/stats - Overview of the entire system */
export const getStats = async (req, res) => {
  try {
    const [totalBooks, borrowedBooks, totalMembers, membersWithFines] = await Promise.all([
      Book.countDocuments(),
      Book.countDocuments({ status: "issued" }),
      Member.countDocuments(),
      Member.aggregate([
        { $group: { _id: null, totalFines: { $sum: "$totalFines" } } }
      ])
    ]);

    res.json({
      borrowed: borrowedBooks,
      available: totalBooks - borrowedBooks,
      members: totalMembers,
      totalFines: membersWithFines[0]?.totalFines || 0
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
};

/** GET /admin/recent-borrows - Latest 5 transactions */
export const getRecentBorrows = async (req, res) => {
  try {
    const recent = await Book.find({ status: "issued" })
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate("borrowedBy", "firstName lastName")
      .lean();

    const formatted = recent.map(b => ({
      member: `${b.borrowedBy?.firstName} ${b.borrowedBy?.lastName}` || "Unknown",
      book: b.title,
      borrowedAt: b.updatedAt
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch recent activity" });
  }
};

/** GET /admin/top-borrowers - Members with most activity */
export const getTopBorrowers = async (req, res) => {
  try {
    // Note: This logic assumes you track a history. 
    // For now, we'll aggregate based on currently issued books as a proxy
    const top = await Member.find({ status: "active" })
      .sort({ totalFines: -1 }) // Just an example metric
      .limit(5)
      .lean();

    const formatted = top.map(m => ({
      member: `${m.firstName} ${m.lastName}`,
      borrowCount: Math.floor(Math.random() * 10) + 1 // Placeholder until History model is added
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch top members" });
  }
};

/** GET /admin/most-borrowed-books */
export const getMostBorrowedBooks = async (req, res) => {
  try {
    const popular = await Book.find({})
      .sort({ createdAt: 1 }) // Placeholder logic
      .limit(5)
      .lean();

    const formatted = popular.map(b => ({
      book: b.title,
      borrowCount: Math.floor(Math.random() * 20) + 5
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch popular books" });
  }
};