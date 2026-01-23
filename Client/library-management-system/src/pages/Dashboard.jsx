import { useEffect, useState } from "react";
import API from "../api/api";

export default function Dashboard({ books }) {
  const [stats, setStats] = useState({ borrowed: 0, members: 0 });

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

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-primary text-primary-content">
          <div className="card-body">
            <h2 className="card-title">Total Books</h2>
            <p className="text-3xl">{books.length}</p>
          </div>
        </div>

        <div className="card bg-secondary text-secondary-content">
          <div className="card-body">
            <h2 className="card-title">Borrowed</h2>
            <p className="text-3xl">{stats.borrowed}</p>
          </div>
        </div>

        <div className="card bg-accent text-accent-content">
          <div className="card-body">
            <h2 className="card-title">Members</h2>
            <p className="text-3xl">{stats.members}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
