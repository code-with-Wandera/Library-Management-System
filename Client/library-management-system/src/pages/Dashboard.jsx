import { useEffect, useState, useRef } from "react";
import API from "../api/api";
import { toast } from "react-hot-toast"; // Ensure this is installed
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  LineChart, Line, CartesianGrid 
} from "recharts";

export default function Dashboard({ books = [] }) {
  const [data, setData] = useState({
    stats: { borrowed: 0, members: 0, available: 0, totalFines: 0 },
    recentBorrows: [],
    topBorrowers: [],
    mostBorrowedBooks: [],
    growth: []
  });

  // --- ACTIVE LOANS STATE ---
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  // --- FETCH ALL DATA ---
  const fetchDashboardData = async (controller) => {
    try {
      setLoading(true);
      const [statsRes, loansRes] = await Promise.all([
        API.get("/admin/dashboard-data", { signal: controller?.signal }),
        API.get("/borrow/active", { signal: controller?.signal })
      ]);
      
      setData(statsRes.data);
      setLoans(loansRes.data);
      hasFetched.current = true;
    } catch (err) {
      if (err.name !== 'CanceledError') {
        console.error("Dashboard Data Fetch Error:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasFetched.current) return;
    const controller = new AbortController();
    fetchDashboardData(controller);
    return () => controller.abort();
  }, []);

  // --- RETURN BOOK LOGIC ---
const handleReturn = async (borrowId) => {
  if (!window.confirm("Confirm book return?")) return;

  try {
    const res = await API.patch(`/borrow/return/${borrowId}`);
    const { fineIncurred } = res.data;

    if (fineIncurred > 0) {
      // Replace toast.error with alert
      alert(`Book Returned Late! Fine of $${fineIncurred.toFixed(2)} added to member account.`);
    } else {
      // Replace toast.success with alert
      alert("Book returned on time.");
    }

    fetchDashboardData();
  } catch (err) {
    alert("Error processing return.");
  }
};

  const statusChartData = [
    { name: "Borrowed", count: data.stats.borrowed },
    { name: "Available", count: data.stats.available },
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

      {/* --- STATS CARDS (Unchanged) --- */}
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
            <div className="stat-value">{data.stats.borrowed}</div>
          </div>
        </div>

        <div className="stats shadow bg-accent text-accent-content">
          <div className="stat">
            <div className="stat-title text-accent-content opacity-70">Members</div>
            <div className="stat-value">{data.stats.members}</div>
          </div>
        </div>

        <div className="stats shadow bg-error text-error-content">
          <div className="stat">
            <div className="stat-title text-error-content opacity-70">Pending Fines</div>
            <div className="stat-value">${data.stats.totalFines?.toFixed(2) || "0.00"}</div>
          </div>
        </div>
      </div>

      {/* --- CHARTS SECTION (Unchanged) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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

        <div className="card bg-base-200 shadow-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Member Registration Growth</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.growth}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#d926aa" strokeWidth={3} dot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* --- INJECTED: ACTIVE LOANS MANAGEMENT --- */}
      <div className="card bg-base-200 shadow-xl border border-base-300">
        <div className="p-6 border-b border-base-300 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Current Active Loans</h2>
          <span className="badge badge-primary">{loans.length} Outstanding</span>
        </div>
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-base-300/50">
              <tr>
                <th>Book Title</th>
                <th>Member</th>
                <th>Due Date</th>
                <th>Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => {
                const isOverdue = new Date(loan.dueDate) < new Date();
                return (
                  <tr key={loan._id} className="hover">
                    <td>
                      <div className="font-bold">{loan.bookId?.title}</div>
                      <div className="text-xs opacity-50">{loan.bookId?.isbn}</div>
                    </td>
                    <td>{loan.memberId?.firstName} {loan.memberId?.lastName}</td>
                    <td className={isOverdue ? "text-error font-bold" : ""}>
                      {new Date(loan.dueDate).toLocaleDateString()}
                    </td>
                    <td>
                      {isOverdue ? (
                        <span className="badge badge-error text-white">Overdue</span>
                      ) : (
                        <span className="badge badge-success text-white">On Time</span>
                      )}
                    </td>
                    <td className="text-right">
                      <button 
                        onClick={() => handleReturn(loan._id)}
                        className="btn btn-sm btn-primary btn-outline"
                      >
                        Return
                      </button>
                    </td>
                  </tr>
                );
              })}
              {loans.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-10 opacity-50 italic">No active loans found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- RECENT ACTIVITY TABLE (Unchanged) --- */}
      <div className="card bg-base-200 shadow-xl overflow-hidden border border-base-300">
        <div className="p-6 border-b border-base-300 bg-base-300/50">
          <h2 className="text-xl font-semibold">Recent Activity History</h2>
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
              {data.recentBorrows.length > 0 ? (
                data.recentBorrows.map((b, i) => (
                  <tr key={i} className="hover">
                    <td className="font-medium">{b.member}</td>
                    <td>{b.book}</td>
                    <td>{new Date(b.borrowedAt).toLocaleDateString()}</td>
                    <td><span className="badge badge-success badge-sm text-white">Issued</span></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-10 opacity-50">No history recorded.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}