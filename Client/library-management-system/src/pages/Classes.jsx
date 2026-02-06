import { useEffect, useState, useCallback } from "react";
import API from "../api/api.js";

export default function Classes() {
  // States
  const [classes, setClasses] = useState([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 5;

  // User info for role-based actions
  const user = JSON.parse(localStorage.getItem("user"));

  // Fetch classes with search & pagination
  // Wrapped in useCallback to prevent the infinite loop from your logs
  const fetchClasses = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await API.get("/classes", {
        params: { search, page, limit },
      });

      // DEBUG: Log this to see what your backend actually sends!
      console.log("Backend Response:", res.data);

      // Adaptation: Handle both { data: [] } and { classes: [] } structures
      setClasses(res.data.data || res.data.classes || []);
      setTotalPages(res.data.pages || res.data.pagination?.totalPages || 1);
    } catch (err) {
      console.error("Fetch Error:", err);
      if (err.response?.status === 404) {
        setError("API Route /api/classes not found. Check backend server.");
      } else {
        setError("Failed to fetch classes");
      }
    } finally {
      setLoading(false);
    }
  }, [search, page, limit]);

  // Reset to page 1 ONLY when the user is actually searching
  useEffect(() => {
    if (search !== "") {
        setPage(1);
    }
  }, [search]);

  // Fetch classes when page or search changes
  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  /* ----------------- HANDLERS ----------------- */

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return showMessage("Class name cannot be empty", "error");

    try {
      if (editingId) {
        const res = await API.patch(`/classes/${editingId}`, { name: trimmedName });
        setClasses((prev) => prev.map((c) => (c._id === editingId ? res.data : c)));
        showMessage("Class updated successfully", "success");
      } else {
        const res = await API.post("/classes", { name: trimmedName });
        // Refresh list to maintain correct pagination order
        fetchClasses(); 
        showMessage("Class added successfully", "success");
      }
      setName("");
      setEditingId(null);
    } catch (err) {
      showMessage(err.response?.data?.message || "Operation failed", "error");
    }
  }

  async function deleteClass(id) {
    if (!confirm("Are you sure?")) return;
    try {
      await API.delete(`/classes/${id}`);
      fetchClasses(); // Refresh to update pagination counts
      showMessage("Deleted successfully", "success");
    } catch (err) {
      showMessage("Delete failed", "error");
    }
  }

  function showMessage(text, type) {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  }

  return (
    <div className="p-6 bg-white rounded shadow-md max-w-lg mx-auto mt-6 text-gray-800">
      <h1 className="text-2xl font-bold mb-4">Class Management</h1>

      {message.text && (
        <div className={`mb-4 p-2 rounded ${message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {message.text}
        </div>
      )}

      {error && <div className="alert alert-error mb-4 text-sm">{error}</div>}

      <input
        className="input input-bordered w-full mb-3"
        placeholder="Search classes..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {user?.role === "admin" && (
        <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
          <input
            className="input input-bordered w-full"
            placeholder="Class name (e.g. S1A)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button className="btn btn-primary">{editingId ? "Update" : "Add"}</button>
        </form>
      )}

      <div className="min-h-[200px]">
        {loading ? (
          <p className="text-center py-4">Loading...</p>
        ) : classes.length === 0 ? (
          <p className="text-center py-4 text-gray-400">No classes found</p>
        ) : (
          <div className="space-y-2">
            {classes.map((c) => (
              <div key={c._id} className="flex justify-between items-center border p-3 rounded hover:bg-gray-50 transition-colors">
                <span className="font-medium">{c.name}</span>
                {user?.role === "admin" && (
                  <div className="flex gap-2">
                    <button className="btn btn-xs btn-warning" onClick={() => { setName(c.name); setEditingId(c._id); }}>Edit</button>
                    <button className="btn btn-xs btn-error" onClick={() => deleteClass(c._id)}>Delete</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-6 border-t pt-4">
        <button
          className="btn btn-sm btn-outline"
          disabled={page === 1 || loading}
          onClick={() => setPage((p) => p - 1)}
        >
          Previous
        </button>

        <span className="text-sm font-semibold">
          Page {page} of {totalPages}
        </span>

        <button
          className="btn btn-sm btn-outline"
          disabled={page >= totalPages || loading}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}