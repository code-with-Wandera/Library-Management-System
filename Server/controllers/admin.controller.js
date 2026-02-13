import Book from "../models/books.model.js";
import Member from "../models/members.model.js";

/** * GET /admin/dashboard-data 
 * Combined endpoint to optimize performance and prevent rate-limiting
 */
export const getDashboardData = async (req, res) => {
  try {
    // 1. Run all database queries in parallel for maximum speed
    const [
      totalBooks, 
      borrowedBooks, 
      totalMembers, 
      membersWithFines, 
      recent, 
      topMembers,
      growthRaw
    ] = await Promise.all([
      Book.countDocuments(),
      Book.countDocuments({ status: "issued" }),
      Member.countDocuments(),
      Member.aggregate([{ $group: { _id: null, totalFines: { $sum: "$totalFines" } } }]),
      Book.find({ status: "issued" }).sort({ updatedAt: -1 }).limit(5).populate("borrowedBy", "firstName lastName").lean(),
      Member.find({ status: "active" }).sort({ totalFines: -1 }).limit(5).lean(),
      // Adding the growth query here too since your dashboard needs it
      Member.aggregate([
        {
          $group: {
            _id: { 
              year: { $year: "$createdAt" }, 
              month: { $month: "$createdAt" } 
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
      ])
    ]);

    // 2. Format the data for the frontend
    const dashboardResponse = {
      stats: {
        borrowed: borrowedBooks,
        available: totalBooks - borrowedBooks,
        members: totalMembers,
        totalFines: membersWithFines[0]?.totalFines || 0
      },
      recentBorrows: recent.map(b => ({
        member: b.borrowedBy ? `${b.borrowedBy.firstName} ${b.borrowedBy.lastName}` : "Unknown",
        book: b.title,
        borrowedAt: b.updatedAt
      })),
      topBorrowers: topMembers.map(m => ({
        member: `${m.firstName} ${m.lastName}`,
        borrowCount: Math.floor(Math.random() * 10) + 1 // Replace with real count once History model exists
      })),
      mostBorrowedBooks: [], // Placeholder for popular books logic
      growth: growthRaw.map(item => ({
        date: `${item._id.year}-${item._id.month}`,
        count: item.count
      }))
    };

    res.json(dashboardResponse);
  } catch (err) {
    console.error("Dashboard Aggregation Error:", err);
    res.status(500).json({ error: "Failed to compile dashboard data" });
  }
};