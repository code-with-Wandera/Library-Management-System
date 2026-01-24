import { useEffect, useState } from "react";
import API from "../api/api.js";

export default function Classes() {
  const [classes, setClasses] = useState([]);
  const [name, setName] = useState("");

  async function fetchClasses() {
    const res = await API.get("/classes");
    setClasses(res.data);
  }

  async function addClass(e) {
    e.preventDefault();
    if (!name) return;

    await API.post("/classes", { name });
    setName("");
    fetchClasses();
  }

  async function deleteClass(id) {
    await API.delete(`/classes/${id}`);
    fetchClasses();
  }

  useEffect(() => {
    fetchClasses();
  }, []);

  return (
    <div className="p-6 bg-white rounded shadow-md max-w-lg">
      <h1 className="text-2xl font-bold mb-4">Classes</h1>

      <form onSubmit={addClass} className="flex gap-2 mb-4">
        <input
          className="input input-bordered w-full"
          placeholder="Class name e.g. S1A"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="btn btn-primary">Add</button>
      </form>

      <div className="space-y-2">
        {classes.map((c) => (
          <div
            key={c._id}
            className="flex justify-between items-center border p-3 rounded"
          >
            <span>{c.name}</span>
            <button
              className="btn btn-sm btn-error"
              onClick={() => deleteClass(c._id)}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
