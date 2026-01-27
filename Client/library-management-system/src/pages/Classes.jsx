import { useEffect, useState } from "react";
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
  const [limit] = useState(5); // items per page
  const [totalPages, setTotalPages] = useState(1);

  // User info and JWT
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  // Axios config with Authorization header
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // Fetch classes with search & pagination
  async function fetchClasses() {
    try {
      setLoading(true);
      setError("");

      const res = await API.get("/classes", {
        params: { search, page, limit },
      });

      setClasses(res.data.data || []);
      setTotalPages(res.data.pages || 1);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch classes");
    } finally {
      setLoading(false);
    }
  }

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  // Fetch classes when page or search changes
  useEffect(() => {
    fetchClasses();
  }, [search, page]);

  // Add / Update class
  async function handleSubmit(e) {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return showMessage("Class name cannot be empty", "error");

    try {
      if (editingId) {
        const current = classes.find((c) => c._id === editingId);
        if (current && current.name === trimmedName) {
          return showMessage("No changes detected", "error");
        }

        const res = await API.patch(`/classes/${editingId}`, { name: trimmedName }, config);

        setClasses((prev) =>
          prev.map((c) => (c._id === editingId ? res.data : c))
        );
        showMessage("Class updated successfully", "success");
      } else {
        const res = await API.post("/classes", { name: trimmedName }, config);
        setClasses((prev) => [res.data, ...prev]);
        showMessage("Class added successfully", "success");
      }

      setName("");
      setEditingId(null);
    } catch (err) {
      console.error(err.response?.data);
      const msg = err.response?.data?.message || "Operation failed";
      showMessage(msg, "error");
    }
  }

  // Delete class
  async function deleteClass(id) {
    if (!confirm("Are you sure you want to delete this class?")) return;

    try {
      await API.delete(`/classes/${id}`, config);
      setClasses((prev) => prev.filter((c) => c._id !== id));
      showMessage("Class deleted successfully", "success");
    } catch (err) {
      console.error(err);
      showMessage("Failed to delete class", "error");
    }
  }

  // Set editing state
  function editClass(c) {
    setName(c.name);
    setEditingId(c._id);
  }

  // Display notification
  function showMessage(text, type) {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  }

  return (
    <div className="p-6 bg-white rounded shadow-md max-w-lg mx-auto mt-6">
      <h1 className="text-2xl font-bold mb-4">Classes</h1>

      {/* Notification */}
      {message.text && (
        <div
          className={`mb-4 p-2 rounded ${
            message.type === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Search Input */}
      <input
        className="input input-bordered w-full mb-3"
        placeholder="Search classes..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Add/Edit Form (Admin only) */}
      {user?.role === "admin" && (
        <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
          <input
            className="input input-bordered w-full"
            placeholder="Class name e.g. S1A"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button className="btn btn-primary">
            {editingId ? "Update" : "Add"}
          </button>
        </form>
      )}

      {/* Classes List */}
      {loading ? (
        <p>Loading classes...</p>
      ) : classes.length === 0 ? (
        <p>No classes available</p>
      ) : (
        <div className="space-y-2">
          {classes.map((c) => (
            <div
              key={c._id}
              className="flex justify-between items-center border p-3 rounded"
            >
              <span>{c.name}</span>

              {user?.role === "admin" && (
                <div className="flex gap-2">
                  <button
                    className="btn btn-sm btn-warning"
                    onClick={() => editClass(c)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-sm btn-error"
                    onClick={() => deleteClass(c._id)}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-between mt-4">
          <button
            className="btn btn-sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Prev
          </button>

          <span>Page {page} of {totalPages}</span>

          <button
            className="btn btn-sm"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
