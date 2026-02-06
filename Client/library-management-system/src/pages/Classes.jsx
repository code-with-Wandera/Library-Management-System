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

  // Fetch classes with member counts (from the aggregation we built)
  const fetchClasses = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await API.get("/classes", {
        params: { search, page, limit },
      });

      // res.data.data contains the classes + memberCount from the aggregation
      setClasses(res.data.data || []);
      setTotalPages(res.data.pages || 1);
    } catch (err) {
      console.error("Fetch Error:", err);
      setError(err.response?.status === 404 
        ? "API Route not found. Check backend router paths." 
        : "Failed to fetch classes");
    } finally {
      setLoading(false);
    }
  }, [search, page]); // Re-fetch only when search or page changes

  // Reset to page 1 whenever the user types in the search box
  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  /* HANDLERS */

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return showMessage("Class name cannot be empty", "error");

    try {
      if (editingId) {
        // Update Class
        const res = await API.patch(`/classes/${editingId}`, { name: trimmedName });
        // Update local state by merging the updated class name
        setClasses((prev) => prev.map((c) => (c._id === editingId ? { ...c, name: res.data.name } : c)));
        showMessage("Class updated successfully", "success");
      } else {
        // Create Class
        await API.post("/classes", { name: trimmedName });
        fetchClasses(); // Refresh to show the new class in the list
        showMessage("Class added successfully", "success");
      }
      setName("");
      setEditingId(null);
    } catch (err) {
      showMessage(err.response?.data?.message || "Operation failed", "error");
    }
  }

  async function deleteClass(id) {
    if (!confirm("Are you sure? This will unassign all members in this class.")) return;
    try {
      await API.delete(`/classes/${id}`);
      fetchClasses(); 
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
    <div className="p-6 bg-white rounded-xl shadow-lg max-w-2xl mx-auto mt-6 text-gray-800 border border-gray-100">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        🏫 Class Management
      </h1>

      {message.text && (
        <div className={`mb-4 p-3 rounded-lg animate-pulse ${
          message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        }`}>
          {message.text}
        </div>
      )}

      {error && <div className="alert alert-error mb-4 shadow-sm">{error}</div>}

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <input
          className="input input-bordered w-full"
          placeholder="Search classes by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        
        {user?.role === "admin" && (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              className="input input-bordered w-full md:w-48"
              placeholder="New Class (e.g. S4B)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button className="btn btn-primary">
              {editingId ? "Update" : "Add"}
            </button>
          </form>
        )}
      </div>

      <div className="min-h-[300px] space-y-3">
        {loading ? (
          <div className="flex justify-center py-10"><span className="loading loading-spinner loading-lg"></span></div>
        ) : classes.length === 0 ? (
          <div className="text-center py-10 text-gray-400 italic">No classes found matching your search.</div>
        ) : (
          classes.map((c) => (
            <div key={c._id} className="flex justify-between items-center border p-4 rounded-xl hover:bg-slate-50 transition-all border-gray-100 shadow-sm">
              <div>
                <span className="font-bold text-lg block">{c.name}</span>
                {/* DISPLAY THE AGGREGATED COUNT HERE */}
                <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wider">
                  {c.memberCount || 0} Members Enrolled
                </span>
              </div>

              {user?.role === "admin" && (
                <div className="flex gap-2">
                  <button 
                    className="btn btn-sm btn-ghost text-warning" 
                    onClick={() => { setName(c.name); setEditingId(c._id); }}
                  >
                    Edit
                  </button>
                  <button 
                    className="btn btn-sm btn-ghost text-error" 
                    onClick={() => deleteClass(c._id)}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-8 border-t pt-4">
        <button
          className="btn btn-sm btn-outline"
          disabled={page === 1 || loading}
          onClick={() => setPage((p) => p - 1)}
        >
          Previous
        </button>

        <div className="text-sm font-medium bg-gray-100 px-4 py-1 rounded-full">
          Page <span className="text-indigo-600">{page}</span> of {totalPages}
        </div>

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