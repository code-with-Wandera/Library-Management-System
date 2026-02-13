import { useEffect, useState, useRef } from "react";
import API from "../api/api";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  LineChart, Line, CartesianGrid 
} from "recharts";

export default function Dashboard({ books = [] }) {
  const [stats, setStats] = useState({ borrowed: 0, members: 0, available: 0, totalFines: 0 });
  const [recentBorrows, setRecentBorrows] = useState([]);
  const [topBorrowers, setTopBorrowers] = useState([]);
  const [mostBorrowedBooks, setMostBorrowedBooks] = useState([]);
  const [growthData, setGrowthData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Defensive: Track if data has already been fetched this session
  const hasFetched = useRef(false);

  useEffect(() => {
    // If we've already fetched in this mount cycle, stop (prevents StrictMode double-trigger)
    if (hasFetched.current) return;
    
    const controller = new AbortController();

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Parallel fetching for production performance
        const [s, rb, tb, mb, gr] = await Promise.all([
          API.get("/admin/stats", { signal: controller.signal }),
          API.get("/admin/recent-borrows", { signal: controller.signal }),
          API.get("/admin/top-borrowers", { signal: controller.signal }),
          API.get("/admin/most-borrowed-books", { signal: controller.signal }),
          API.get("/members/analytics/growth", { signal: controller.signal })
        ]);

        setStats(s.data || { borrowed: 0, members: 0, available: 0, totalFines: 0 });
        setRecentBorrows(rb.data || []);
        setTopBorrowers(tb.data || []);
        setMostBorrowedBooks(mb.data || []);
        
        if (gr.data && Array.isArray(gr.data)) {
          setGrowthData(gr.data.map(item => ({
            date: item._id ? `${item._id.year}-${item._id.month}` : "N/A",
            count: item.count || 0
          })));
        }

        hasFetched.current = true;
      } catch (err) {
        if (err.name !== 'CanceledError') {
          console.error("Dashboard Sync Error:", err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    // Cleanup: Cancel requests if component unmounts
    return () => controller.abort();
  }, []);

  const statusChartData = [
    { name: "Borrowed", count: stats.borrowed },
    { name: "Available", count: stats.available },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-base-100">
        <span className="loading loading-dots loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 bg-base-100 min-h-screen animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Library Analytics</h1>
        <div className="badge badge-primary badge-outline font-mono">
          {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* --- STATS CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="stats shadow bg-primary text-primary-content">
          <div className="stat">
            <div className="stat-title text-primary-content opacity-70">Total Books</div>
            <div className="stat-value">{books.length || 0}</div>
          </div>
        </div>
        
        <div className="stats shadow bg-secondary text-secondary-content">
          <div className="stat">
            <div className="stat-title text-secondary-content opacity-70">Active Loans</div>
            <div className="stat-value">{stats.borrowed}</div>
          </div>
        </div>

        <div className="stats shadow bg-accent text-accent-content">
          <div className="stat">
            <div className="stat-title text-accent-content opacity-70">Members</div>
            <div className="stat-value">{stats.members}</div>
          </div>
        </div>

        <div className="stats shadow bg-error text-error-content">
          <div className="stat">
            <div className="stat-title text-error-content opacity-70">Pending Fines</div>
            <div className="stat-value">${stats.totalFines?.toFixed(2) || "0.00"}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* --- BOOK STATUS CHART --- */}
        <div className="card bg-base-200 shadow-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Inventory Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statusChartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} />
              <Bar dataKey="count" fill="#641ae6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* --- MEMBER GROWTH CHART --- */}
        <div className="card bg-base-200 shadow-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Member Registration Growth</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#d926aa" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* --- RECENT ACTIVITY --- */}
      <div className="card bg-base-200 shadow-xl overflow-hidden border border-base-300">
        <div className="p-6 border-b border-base-300 bg-base-300/50">
          <h2 className="text-xl font-semibold">Recent Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-base-300/30">
              <tr>
                <th>Member</th>
                <th>Book Title</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentBorrows.length > 0 ? (
                recentBorrows.map((b, i) => (
                  <tr key={i} className="hover">
                    <td className="font-medium">{b.member}</td>
                    <td>{b.book}</td>
                    <td>{new Date(b.borrowedAt).toLocaleDateString()}</td>
                    <td><span className="badge badge-success badge-sm text-white">Issued</span></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-10 opacity-50">No recent transactions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}