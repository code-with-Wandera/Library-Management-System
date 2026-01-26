import { useEffect, useState } from "react";
import API from "../api/api.js";

export default function Classes() {
  const [classes, setClasses] = useState([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [error, setError] = useState("");

  async function fetchClasses() {
    try {
      setLoading(true);
      setError("");
      const res = await API.get("/classes");
      setClasses(res.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch classes.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name) return showMessage("Class name cannot be empty", "error");

    try {
      if (editingId) {
        await API.put(`/classes/${editingId}`, { name });
        showMessage("Class updated successfully", "success");
      } else {
        await API.post("/classes", { name });
        showMessage("Class added successfully", "success");
      }
      setName("");
      setEditingId(null);
      fetchClasses();
    } catch (err) {
      console.error(err);
      showMessage("Operation failed", "error");
    }
  }

  async function deleteClass(id) {
    if (!confirm("Are you sure you want to delete this class?")) return;

    try {
      await API.delete(`/classes/${id}`);
      showMessage("Class deleted successfully", "success");
      fetchClasses();
    } catch (err) {
      console.error(err);
      showMessage("Failed to delete class", "error");
    }
  }

  function editClass(c) {
    setName(c.name);
    setEditingId(c._id);
  }

  function showMessage(text, type) {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  }

  useEffect(() => {
    fetchClasses();
  }, []);

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

      {/* Add/Edit Form */}
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
