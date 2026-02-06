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
  return response.data;
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
  const [totalCount, setTotalCount] = useState(0); // Track true total for analytics
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
      return token ? (jwtDecode(token)?.role ?? "viewer") : "viewer";
    } catch {
      return "viewer";
    }
  }, []);

  const canWrite = role === "admin" || role === "librarian";
  const canDelete = role === "admin";

  const fetchMembers = useCallback(
    async (targetPage = page) => {
      try {
        setLoading(true);
        setError("");
        const res = await API.get("/members", {
          params: { page: targetPage, limit: LIMIT, search, sortBy, order },
        });
        setMembers(res.data.members || []);
        setTotalPages(res.data?.pagination?.totalPages || 1);
        setTotalCount(res.data?.pagination?.total || 0); // Store actual total count
        setPage(res.data?.pagination?.page || targetPage);
      } catch (err) {
        console.error("Fetch Error:", err);
        setError("Failed to fetch members.");
      } finally {
        setLoading(false);
      }
    },
    [search, sortBy, order, page],
  );

  const fetchMemberGrowth = async () => {
    try {
      setGrowthLoading(true);
      const res = await API.get("/members/analytics/growth");

      const chartData = Array.isArray(res.data)
        ? res.data.map((item) => ({
            // Formats as "MM/DD" for a cleaner look
            date: `${item._id.month}/${item._id.day}`,
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

  // Sync list when filters/page change
  useEffect(() => {
    fetchMembers(page);
  }, [fetchMembers, page]);

  // Initial load for growth
  useEffect(() => {
    fetchMemberGrowth();
  }, []);

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
      setError("");
      await API.post("/members", {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim() || undefined,
      });

      // Reset Form
      setFirstName("");
      setLastName("");
      setEmail("");

      // Force Refresh UI
      if (page === 1) {
        fetchMembers(1);
      } else {
        setPage(1); // Setting page to 1 triggers the useEffect above
      }
      fetchMemberGrowth();
    } catch (err) {
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

      // If we delete the last item on a page, go back one page
      const nextTargetPage = members.length === 1 && page > 1 ? page - 1 : page;
      setPage(nextTargetPage);
      fetchMembers(nextTargetPage);
      fetchMemberGrowth();
    } catch {
      setError("Failed to delete member.");
    } finally {
      setLoading(false);
    }
  };

  /* ----------------- CSV LOGIC ----------------- */
  const handleCSVPreview = (file) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const errors = [];
        const validRows = [];
        results.data.forEach((row, i) => {
          const fName = row.firstName?.trim();
          const lName = row.lastName?.trim();
          if (!fName || !lName) errors.push(`Row ${i + 1}: Missing names`);
          else
            validRows.push({
              firstName: fName,
              lastName: lName,
              email: row.email?.trim(),
            });
        });
        setCsvErrors(errors);
        setCsvPreview(validRows);
      },
    });
  };

  const uploadCSV = async (e) => {
    e.preventDefault();
    if (!canWrite || !file || csvErrors.length) return;
    try {
      setLoading(true);
      const result = await importMembersCSV(file);
      setFile(null);
      setCsvPreview([]);
      setPage(1);
      fetchMembers(1);
      fetchMemberGrowth();
      if (result.errors?.length) alert(`Skipped rows: ${result.errors.length}`);
    } catch {
      setError("CSV import failed.");
    } finally {
      setLoading(false);
    }
  };

  const analytics = useMemo(
    () => ({
      total: totalCount, // Real database total
      initials: members.filter((m) => m.firstName?.[0]?.toUpperCase() === "A")
        .length,
    }),
    [totalCount, members],
  );

  return (
    <div className="p-6 bg-white rounded-xl shadow w-full space-y-6 text-gray-800">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Library Members</h1>
        <span className="badge badge-ghost">Role: {role}</span>
      </div>

      {/* Analytics & Growth Chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="stats shadow bg-indigo-50">
          <div className="stat">
            <div className="stat-title">Total Database Members</div>
            <div className="stat-value text-indigo-600">{analytics.total}</div>
          </div>
          <div className="stat">
            <div className="stat-title">Starts with 'A' (On Page)</div>
            <div className="stat-value text-secondary">
              {analytics.initials}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded shadow border">
          <h2 className="text-sm font-semibold mb-2 text-gray-500 uppercase tracking-wider">
            Member Growth
          </h2>
          {growthLoading ? (
            <div className="h-[200px] flex items-center justify-center">
              Loading chart...
            </div>
          ) : growthData.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center">
              No data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={growthData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f0f0f0"
                />
                <XAxis dataKey="month" fontSize={12} tickMargin={10} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="members"
                  stroke="#4f46e5"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 p-4 bg-gray-50 rounded-lg">
        <input
          className="input input-bordered flex-grow"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="select select-bordered"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="createdAt">Sort: Date Added</option>
          <option value="firstName">Sort: First Name</option>
        </select>
        <select
          className="select select-bordered"
          value={order}
          onChange={(e) => setOrder(e.target.value)}
        >
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
        <button
          className="btn btn-primary"
          onClick={() => {
            setPage(1);
            fetchMembers(1);
          }}
        >
          Search
        </button>
      </div>

      {/* Add Member Form */}
      {canWrite && (
        <div className="collapse collapse-plus bg-base-200">
          <input type="checkbox" />
          <div className="collapse-title text-lg font-medium">
            Add New Member
          </div>
          <div className="collapse-content">
            <form onSubmit={addMember} className="flex gap-2 flex-wrap">
              <input
                className="input input-bordered"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <input
                className="input input-bordered"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
              <input
                className="input input-bordered"
                placeholder="Email (optional)"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button className="btn btn-primary" disabled={loading}>
                {loading ? "Adding..." : "Add Member"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Members List */}
      <div className="overflow-x-auto border rounded-lg">
        <table className="table w-full">
          <thead>
            <tr className="bg-gray-100">
              <th>Name</th>
              <th>Email</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td colSpan="3" className="text-center p-4">
                  No members found.
                </td>
              </tr>
            ) : (
              members.map((m) => (
                <tr key={m._id} className="hover">
                  <td className="font-medium">
                    {m.firstName} {m.lastName}
                  </td>
                  <td className="text-gray-500">
                    {m.email || (
                      <span className="italic text-xs opacity-50">
                        No email
                      </span>
                    )}
                  </td>
                  <td className="text-right flex justify-end gap-2">
                    <Link
                      to={`/members/${m._id}`}
                      className="btn btn-xs btn-info"
                    >
                      View
                    </Link>
                    {canDelete && (
                      <button
                        className="btn btn-xs btn-error"
                        onClick={() => removeMember(m._id)}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col items-center gap-2 mt-4">
        <div className="btn-group flex gap-1">
          <button
            className="btn btn-sm btn-outline"
            disabled={page === 1 || loading}
            onClick={() => setPage((p) => p - 1)} // Updates state, which triggers useEffect
          >
            « Prev
          </button>

          <button className="btn btn-sm btn-active no-animation px-6">
            Page {page} of {totalPages}
          </button>

          <button
            className="btn btn-sm btn-outline"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)} // Updates state, which triggers useEffect
          >
            Next »
          </button>
        </div>
        <p className="text-xs text-gray-400">
          Showing {members.length} of {totalCount} total members
        </p>
      </div>

      {/* CSV Import/Export */}
      {canWrite && (
        <div className="divider text-xs text-gray-400">Data Management</div>
      )}
      {canWrite && (
        <div className="flex flex-wrap gap-4 items-end">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Import via CSV</span>
            </label>
            <input
              type="file"
              accept=".csv"
              className="file-input file-input-bordered file-input-sm"
              onChange={(e) => {
                const f = e.target.files[0];
                setFile(f);
                if (f) handleCSVPreview(f);
              }}
            />
          </div>
          <button
            className="btn btn-sm btn-secondary"
            onClick={uploadCSV}
            disabled={!file || csvErrors.length > 0}
          >
            Upload CSV
          </button>
          <button className="btn btn-sm btn-outline" onClick={exportMembersCSV}>
            Export All to CSV
          </button>
        </div>
      )}

      {error && (
        <div className="alert alert-error shadow-sm text-sm p-2">
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
