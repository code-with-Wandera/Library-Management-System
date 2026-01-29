import { useEffect, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import Papa from "papaparse";
import API from "../api/api";
import jwtDecode from "jwt-decode";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Optional: CSV services
const importMembersCSV = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await API.post("/members/import", formData);
  return response.data; // { message, errors }
};

const exportMembersCSV = async () => {
  const response = await API.get("/members/export", { responseType: "blob" });
  const blob = new Blob([response.data], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "members.csv");
  document.body.appendChild(link);
  link.click();
  link.remove();
};

export default function Members() {
  const [members, setMembers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [order, setOrder] = useState("desc");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [file, setFile] = useState(null);
  const [csvPreview, setCsvPreview] = useState([]);
  const [csvErrors, setCsvErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [growthData, setGrowthData] = useState([]);
  const [growthLoading, setGrowthLoading] = useState(true);

  const LIMIT = 5;

  const role = useMemo(() => {
    try {
      const token = localStorage.getItem("token");
      return token ? jwtDecode(token)?.role ?? "viewer" : "viewer";
    } catch {
      return "viewer";
    }
  }, []);

  const canWrite = role === "admin" || role === "librarian";
  const canDelete = role === "admin";

  const fetchMembers = useCallback(async (targetPage = page) => {
    try {
      setLoading(true);
      setError("");
      const res = await API.get("/members", {
        params: { page: targetPage, limit: LIMIT, search, sortBy, order },
      });
      setMembers(res.data.members || []);
      setTotalPages(res.data?.pagination?.totalPages || 1);
      setPage(res.data?.pagination?.page || targetPage);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch members.");
    } finally {
      setLoading(false);
    }
  }, [page, search, sortBy, order]);

  useEffect(() => {
    fetchMembers(1);
    fetchMemberGrowth();
  }, [fetchMembers]);

  const fetchMemberGrowth = async () => {
    try {
      setGrowthLoading(true);
      const res = await API.get("/members/analytics/growth");
      const chartData = Array.isArray(res.data)
        ? res.data.map(item => ({
            month: item._id ? `${item._id.year}-${String(item._id.month).padStart(2, "0")}` : "Unknown",
            members: item.count || 0,
          }))
        : [];
      setGrowthData(chartData);
    } catch (err) {
      console.error(err);
      setGrowthData([]);
    } finally {
      setGrowthLoading(false);
    }
  };

  /* ----------------- ADD MEMBER ----------------- */
  const addMember = async (e) => {
    e.preventDefault();
    if (!canWrite) return;
    if (!firstName.trim() || !lastName.trim()) {
      setError("First name and last name are required.");
      return;
    }

    try {
      setLoading(true);
      await API.post("/members", { firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim() || undefined });
      setFirstName("");
      setLastName("");
      setEmail("");
      fetchMembers(1);
      fetchMemberGrowth();
      setError("");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to add member.");
    } finally {
      setLoading(false);
    }
  };

  /* ----------------- DELETE MEMBER ----------------- */
  const removeMember = async (id) => {
    if (!canDelete || !window.confirm("Delete this member?")) return;
    try {
      setLoading(true);
      await API.delete(`/members/${id}`);
      fetchMembers(page > 1 && members.length === 1 ? page - 1 : page);
      fetchMemberGrowth();
    } catch {
      setError("Failed to delete member.");
    } finally {
      setLoading(false);
    }
  };

  /* ----------------- CSV PREVIEW ----------------- */
  const handleCSVPreview = (file) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const errors = [];
        const validRows = [];
        results.data.forEach((row, i) => {
          const firstName = row.firstName?.trim();
          const lastName = row.lastName?.trim();
          const email = row.email?.trim() || undefined;
          if (!firstName || !lastName) errors.push(`Row ${i + 1}: Missing firstName or lastName`);
          else validRows.push({ firstName, lastName, email });
        });
        setCsvErrors(errors);
        setCsvPreview(validRows);
      },
    });
  };

  /* ----------------- CSV UPLOAD ----------------- */
  const uploadCSV = async (e) => {
    e.preventDefault();
    if (!canWrite || !file || csvErrors.length) {
      setError("Fix CSV errors before uploading.");
      return;
    }
    try {
      setLoading(true);
      const result = await importMembersCSV(file);
      setFile(null);
      setCsvPreview([]);
      fetchMembers(1);
      fetchMemberGrowth();
      setError("");
      if (result.errors.length) alert(`Some rows skipped:\n${result.errors.join("\n")}`);
      else alert(result.message);
    } catch {
      setError("CSV import failed.");
    } finally {
      setLoading(false);
    }
  };

  /* ----------------- CSV EXPORT ----------------- */
  const downloadCSV = async () => {
    if (!canWrite) return;
    try {
      await exportMembersCSV();
    } catch {
      setError("CSV export failed.");
    }
  };

  const analytics = useMemo(() => ({
    total: members.length,
    initials: members.filter(m => m.firstName?.[0]?.toUpperCase() === "A").length,
  }), [members]);

  return (
    <div className="p-6 bg-white rounded-xl shadow w-full space-y-6">
      <h1 className="text-2xl font-bold">Class Members</h1>

      {/* Analytics & Growth Chart */}
      <div className="stats shadow">
        <div className="stat"><div className="stat-title">Members on Page</div><div className="stat-value">{analytics.total}</div></div>
        <div className="stat"><div className="stat-title">Names Starting with A</div><div className="stat-value">{analytics.initials}</div></div>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-lg font-bold mb-2">Member Growth Over Time</h2>
        {growthLoading ? <p>Loading chart...</p> : growthData.length === 0 ? <p>No growth data available</p> :
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={growthData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="members" stroke="#4f46e5" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        }
      </div>

      {/* Search/Sort */}
      <div className="flex flex-wrap gap-3">
        <input className="input input-bordered" placeholder="Search members..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="select select-bordered" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="createdAt">Date Added</option>
          <option value="firstName">First Name</option>
        </select>
        <select className="select select-bordered" value={order} onChange={(e) => setOrder(e.target.value)}>
          <option value="asc">ASC</option>
          <option value="desc">DESC</option>
        </select>
        <button className="btn" onClick={() => fetchMembers(1)}>Apply</button>
      </div>

      {/* Add Member Form */}
      {canWrite && (
        <form onSubmit={addMember} className="flex gap-2 flex-wrap">
          <input className="input input-bordered" placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} />
          <input className="input input-bordered" placeholder="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} />
          <input className="input input-bordered" placeholder="Email (optional)" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          <button className="btn btn-primary">Add</button>
        </form>
      )}

      {/* CSV Import/Export */}
      {canWrite && (
        <div className="flex flex-col gap-2">
          <form onSubmit={uploadCSV} className="mb-4">
            <input type="file" accept=".csv" className="file-input file-input-bordered" onChange={e => { setFile(e.target.files[0]); handleCSVPreview(e.target.files[0]); }} />
            {csvErrors.length > 0 && <ul className="text-red-500 mt-2 text-sm">{csvErrors.map((e,i) => <li key={i}>{e}</li>)}</ul>}
            {csvPreview.length > 0 && <div className="mt-2 text-sm text-gray-600">{csvPreview.length} valid rows detected</div>}
            <button className="btn btn-secondary mt-2" disabled={csvErrors.length > 0 || !file}>Import CSV</button>
          </form>
          <button className="btn btn-outline" onClick={downloadCSV}>Export CSV</button>
        </div>
      )}

      {/* Members List */}
      <div className="space-y-2">
        {members.map(m => (
          <div key={m._id} className="flex justify-between items-center p-3 border rounded">
            <span>{m.firstName} {m.lastName} {m.email ? `(${m.email})` : ""}</span>
            <div className="flex gap-2">
              <Link to={`/members/${m._id}`} className="btn btn-sm btn-info">View</Link>
              {canDelete && <button className="btn btn-sm btn-error" onClick={() => removeMember(m._id)}>Delete</button>}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-4 mt-4">
        <button className="btn btn-sm" disabled={page === 1} onClick={() => fetchMembers(page-1)}>Prev</button>
        <span>Page {page} of {totalPages}</span>
        <button className="btn btn-sm" disabled={page === totalPages} onClick={() => fetchMembers(page+1)}>Next</button>
      </div>

      {/* Error Message */}
      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  );
}
