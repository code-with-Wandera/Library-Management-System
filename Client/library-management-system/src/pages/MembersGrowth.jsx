import { useEffect, useState } from "react";
import API from "../api/api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

export default function MemberGrowth() {
  const [growthData, setGrowthData] = useState([]);
  const [analytics, setAnalytics] = useState({ totalMembers: 0, byFirstLetter: [] });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch growth chart
  async function fetchGrowth() {
    try {
      setLoading(true);
      const res = await API.get("/members/analytics/growth");
      setGrowthData(res.data);
    } catch (err) {
      console.error("Failed to fetch growth:", err);
    } finally {
      setLoading(false);
    }
  }

  // Fetch analytics summary
  async function fetchAnalytics() {
    try {
      const res = await API.get("/members/analytics");
      setAnalytics(res.data);
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    }
  }

  // CSV import
  async function handleImport(e) {
    e.preventDefault();
    if (!file) return alert("Select CSV file");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await API.post("/members/import", formData);
      alert(res.data.message);
      setFile(null);
      fetchGrowth();
      fetchAnalytics();
    } catch (err) {
      console.error(err);
      alert("CSV import failed");
    }
  }

  // CSV export
  async function handleExport() {
    try {
      const res = await API.get("/members/export", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "members.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
      alert("CSV export failed");
    }
  }

  useEffect(() => {
    fetchGrowth();
    fetchAnalytics();
  }, []);

  return (
    <div className="p-6 bg-white rounded shadow-md w-full flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Member Analytics & Growth</h1>

      {/* Summary */}
      <div className="flex gap-6 flex-wrap">
        <div className="p-4 bg-gray-100 rounded flex-1">
          <p className="text-gray-500">Total Members</p>
          <p className="text-3xl font-bold">{analytics.totalMembers}</p>
        </div>
      </div>

      {/* CSV Import/Export */}
      <form className="flex gap-2 flex-wrap" onSubmit={handleImport}>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files[0])}
          className="input input-bordered"
        />
        <button type="submit" className="btn btn-primary">Import CSV</button>
        <button type="button" onClick={handleExport} className="btn btn-secondary">Export CSV</button>
      </form>

      {/* Growth Line Chart */}
      <div className="p-4 bg-gray-50 rounded">
        <h2 className="text-xl font-bold mb-2">Member Growth Over Time</h2>
        {growthData.length === 0 ? (
          <p>No growth data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={growthData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Analytics by first letter */}
      <div className="p-4 bg-gray-50 rounded">
        <h2 className="text-xl font-bold mb-2">Members by First Letter</h2>
        {analytics.byFirstLetter.length === 0 ? (
          <p>No data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.byFirstLetter.map(item => ({ letter: item._id, count: item.count }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="letter" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#facc15" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
