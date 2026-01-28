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

export default function Members() {
  /* STATE */
  const [members, setMembers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [order, setOrder] = useState("desc");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [file, setFile] = useState(null);
  const [csvPreview, setCsvPreview] = useState([]);
  const [csvErrors, setCsvErrors] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [growthData, setGrowthData] = useState([]);
  const [growthLoading, setGrowthLoading] = useState(true);

  const LIMIT = 5;

  /* AUTH / ROLE */
  const role = useMemo(() => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return "viewer";
      return jwtDecode(token)?.role ?? "viewer";
    } catch {
      return "viewer";
    }
  }, []);

  const canWrite = role === "admin" || role === "librarian";
  const canDelete = role === "admin";

  /* FETCH MEMBERS */
  const fetchMembers = useCallback(
    async (targetPage = page) => {
      try {
        setLoading(true);
        setError("");

        const res = await API.get("/members", {
          params: {
            page: targetPage,
            limit: LIMIT,
            search,
            sortBy,
            order,
          },
        });

        setMembers(res.data?.members ?? []);
        setTotalPages(res.data?.totalPages ?? 1);
        setPage(res.data?.page ?? targetPage);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch members.");
      } finally {
        setLoading(false);
      }
    },
    [page, search, sortBy, order]
  );

  useEffect(() => {
    fetchMembers(1);
    fetchMemberGrowth();
  }, [fetchMembers]);

  /* FETCH MEMBER GROWTH */
  async function fetchMemberGrowth() {
    try {
      setGrowthLoading(true);
      const res = await API.get("/members/analytics/growth");
      // Map backend data to chart
      const chartData = res.data.map((item) => ({
        month: item._id,
        members: item.count,
      }));
      setGrowthData(chartData);
    } catch (err) {
      console.error(err);
    } finally {
      setGrowthLoading(false);
    }
  }

  /* ADD MEMBER */
  async function addMember(e) {
    e.preventDefault();
    if (!canWrite) return;

    if (!firstName.trim() || !lastName.trim()) {
      setError("Both names are required.");
      return;
    }

    try {
      setLoading(true);
      await API.post("/members", {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      setFirstName("");
      setLastName("");
      fetchMembers(1);
      fetchMemberGrowth(); // update chart after add
    } catch {
      setError("Failed to add member.");
    } finally {
      setLoading(false);
    }
  }

  /* DELETE MEMBER */
  async function removeMember(id) {
    if (!canDelete) return;
    if (!window.confirm("Delete this member?")) return;

    try {
      setLoading(true);
      await API.delete(`/members/${id}`);
      fetchMembers(page > 1 && members.length === 1 ? page - 1 : page);
      fetchMemberGrowth(); // update chart after delete
    } catch {
      setError("Failed to delete member.");
    } finally {
      setLoading(false);
    }
  }

  /* CSV PREVIEW & VALIDATION */
  function handleCSVPreview(file) {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const errors = [];
        const validRows = [];

        results.data.forEach((row, index) => {
          if (!row.firstName || !row.lastName) {
            errors.push(`Row ${index + 1}: Missing firstName or lastName`);
          } else {
            validRows.push({
              firstName: row.firstName.trim(),
              lastName: row.lastName.trim(),
            });
          }
        });

        setCsvErrors(errors);
        setCsvPreview(validRows);
      },
    });
  }

  /* CSV UPLOAD */
  async function uploadCSV(e) {
    e.preventDefault();
    if (!canWrite) return;

    if (!file || csvErrors.length) {
      setError("Fix CSV errors before uploading.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      await API.post("/members/import", formData);
      setFile(null);
      setCsvPreview([]);
      fetchMembers(1);
      fetchMemberGrowth(); // update chart after CSV import
    } catch {
      setError("CSV import failed.");
    } finally {
      setLoading(false);
    }
  }

  /* ANALYTICS */
  const analytics = useMemo(() => ({
    total: members.length,
    initials: members.filter((m) => m.firstName?.[0]?.toUpperCase() === "A").length,
  }), [members]);

  /* UI */
  return (
    <div className="p-6 bg-white rounded-xl shadow w-full space-y-6">
      <h1 className="text-2xl font-bold">Class Members</h1>

      {/* ANALYTICS STATS */}
      <div className="stats shadow">
        <div className="stat">
          <div className="stat-title">Members on Page</div>
          <div className="stat-value">{analytics.total}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Names Starting with A</div>
          <div className="stat-value">{analytics.initials}</div>
        </div>
      </div>

      {/* MEMBER GROWTH CHART */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-lg font-bold mb-2">Member Growth Over Time</h2>
        {growthLoading ? (
          <p>Loading chart...</p>
        ) : growthData.length === 0 ? (
          <p>No growth data available</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={growthData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="members" stroke="#4f46e5" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* SEARCH + SORT */}
      <div className="flex flex-wrap gap-3">
        <input
          className="input input-bordered"
          placeholder="Search members..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="select select-bordered"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="createdAt">Date Added</option>
          <option value="firstName">First Name</option>
        </select>
        <select
          className="select select-bordered"
          value={order}
          onChange={(e) => setOrder(e.target.value)}
        >
          <option value="asc">ASC</option>
          <option value="desc">DESC</option>
        </select>
        <button className="btn" onClick={() => fetchMembers(1)}>Apply</button>
      </div>

      {/* ADD MEMBER FORM */}
      {canWrite && (
        <form onSubmit={addMember} className="flex gap-2 flex-wrap">
          <input
            className="input input-bordered"
            placeholder="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <input
            className="input input-bordered"
            placeholder="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
          <button className="btn btn-primary">Add</button>
        </form>
      )}

      {/* CSV UPLOAD */}
      {canWrite && (
        <form onSubmit={uploadCSV} className="mb-4">
          <input
            type="file"
            accept=".csv"
            className="file-input file-input-bordered"
            onChange={(e) => {
              setFile(e.target.files[0]);
              handleCSVPreview(e.target.files[0]);
            }}
          />
          {csvErrors.length > 0 && (
            <ul className="text-red-500 mt-2 text-sm">
              {csvErrors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          )}
          {csvPreview.length > 0 && (
            <div className="mt-2 text-sm text-gray-600">
              {csvPreview.length} valid rows detected
            </div>
          )}
          <button className="btn btn-secondary mt-2" disabled={csvErrors.length > 0 || !file}>
            Import CSV
          </button>
        </form>
      )}

      {/* MEMBERS LIST */}
      <div className="space-y-2">
        {members.map((m) => (
          <div key={m._id} className="flex justify-between items-center p-3 border rounded">
            <span>{m.firstName} {m.lastName}</span>
            <div className="flex gap-2">
              <Link to={`/members/${m._id}`} className="btn btn-sm btn-info">View</Link>
              {canDelete && (
                <button className="btn btn-sm btn-error" onClick={() => removeMember(m._id)}>
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* PAGINATION */}
      <div className="flex justify-center gap-4 mt-4">
        <button className="btn btn-sm" disabled={page === 1} onClick={() => fetchMembers(page - 1)}>Prev</button>
        <span>Page {page} of {totalPages}</span>
        <button className="btn btn-sm" disabled={page === totalPages} onClick={() => fetchMembers(page + 1)}>Next</button>
      </div>

      {/* ERROR MESSAGE */}
      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  );
}
