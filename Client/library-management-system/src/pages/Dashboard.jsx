import { useEffect, useState } from "react";
import API from "../api/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function Dashboard({ books }) {
  const [stats, setStats] = useState({ borrowed: 0, members: 0, available: 0 });
  const [recentBorrows, setRecentBorrows] = useState([]);
  const [topBorrowers, setTopBorrowers] = useState([]);
  const [mostBorrowedBooks, setMostBorrowedBooks] = useState([]);

  useEffect(() => { API.get("/admin/stats").then(res => setStats(res.data)).catch(console.error); }, []);
  useEffect(() => { API.get("/admin/recent-borrows").then(res => setRecentBorrows(res.data)).catch(console.error); }, []);
  useEffect(() => { API.get("/admin/top-borrowers").then(res => setTopBorrowers(res.data)).catch(console.error); }, []);
  useEffect(() => { API.get("/admin/most-borrowed-books").then(res => setMostBorrowedBooks(res.data)).catch(console.error); }, []);

  const chartData = [
    { name: "Borrowed", count: stats.borrowed },
    { name: "Available", count: stats.available || books.length - stats.borrowed },
  ];

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-primary text-primary-content shadow-lg"><div className="card-body"><h2 className="card-title">Total Books</h2><p className="text-4xl">{books.length}</p></div></div>
        <div className="card bg-secondary text-secondary-content shadow-lg"><div className="card-body"><h2 className="card-title">Borrowed</h2><p className="text-4xl">{stats.borrowed}</p></div></div>
        <div className="card bg-accent text-accent-content shadow-lg"><div className="card-body"><h2 className="card-title">Members</h2><p className="text-4xl">{stats.members}</p></div></div>
      </div>

      {/* Borrowed vs Available Chart */}
      <div className="card bg-base-100 shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Books Status</h2>
        <ResponsiveContainer width="100%" height={300}><BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="count" fill="#4f46e5" /></BarChart></ResponsiveContainer>
      </div>

      {/* Recent Borrows Table */}
      <div className="card bg-base-100 shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Recent Borrowed Books</h2>
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead><tr><th>#</th><th>Member</th><th>Book</th><th>Borrowed At</th></tr></thead>
            <tbody>
              {recentBorrows.length > 0 ? recentBorrows.map((b,i)=>(
                <tr key={i}><td>{i+1}</td><td>{b.member}</td><td>{b.book}</td><td>{new Date(b.borrowedAt).toLocaleDateString()}</td></tr>
              )) : <tr><td colSpan="4" className="text-center">No data</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Borrowers & Most Borrowed Books */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card bg-base-100 shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Top Borrowers</h2>
          <ul className="list-disc pl-6 space-y-1">
            {topBorrowers.length > 0 ? topBorrowers.map((u,i)=><li key={i}>{u.member} — {u.borrowCount} books</li>) : "No data available"}
          </ul>
        </div>
        <div className="card bg-base-100 shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Most Borrowed Books</h2>
          <ul className="list-disc pl-6 space-y-1">
            {mostBorrowedBooks.length > 0 ? mostBorrowedBooks.map((b,i)=><li key={i}>{b.book} — {b.borrowCount} times</li>) : "No data available"}
          </ul>
        </div>
      </div>
    </div>
  );
}
