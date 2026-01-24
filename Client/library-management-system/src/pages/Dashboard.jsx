import { useEffect, useState } from "react";
import API from "../api/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function Dashboard({ books }) {
  const [stats, setStats] = useState({ borrowed: 0, members: 0, available: 0 });

  // Fetch admin stats on mount
  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await API.get("/admin/stats");
        setStats(res.data);
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      }
    }
    fetchStats();
  }, []);

  // Prepare chart data
  const chartData = [
    { name: "Borrowed", count: stats.borrowed },
    { name: "Available", count: stats.available || books.length - stats.borrowed },
  ];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card bg-primary text-primary-content shadow-lg">
          <div className="card-body">
            <h2 className="card-title">Total Books</h2>
            <p className="text-4xl font-bold">{books.length}</p>
          </div>
        </div>

        <div className="card bg-secondary text-secondary-content shadow-lg">
          <div className="card-body">
            <h2 className="card-title">Borrowed</h2>
            <p className="text-4xl font-bold">{stats.borrowed}</p>
          </div>
        </div>

        <div className="card bg-accent text-accent-content shadow-lg">
          <div className="card-body">
            <h2 className="card-title">Members</h2>
            <p className="text-4xl font-bold">{stats.members}</p>
          </div>
        </div>
      </div>

      {/* Borrowed vs Available Chart */}
      <div className="card bg-base-100 shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Books Status</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#4f46e5" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
