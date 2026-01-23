import { useEffect, useState } from "react";
import API from "../api/api.js";

export default function Members() {
  const [members, setMembers] = useState([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  // Add at the top of Members component
  const [file, setFile] = useState(null);

  // Function to upload CSV
  async function uploadCSV(e) {
    e.preventDefault();
    if (!file) return alert("Select a CSV file first");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await API.post("/members/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert(res.data.message);
      setFile(null);
      fetchMembers(); // refresh list
    } catch (err) {
      console.error(err);
      alert("CSV import failed");
    }
  }

  // Fetch members from backend
  async function fetchMembers(p = page) {
    try {
      const res = await API.get(`/members?page=${p}&limit=5`);
      setMembers(res.data.members);
      setTotalPages(res.data.totalPages);
      setPage(res.data.page);
    } catch (err) {
      console.error(err);
    }
  }

  // Add member
  async function addMember(e) {
    e.preventDefault();
    if (!firstName || !lastName) return;

    await API.post("/members", { firstName, lastName });
    setFirstName("");
    setLastName("");
    fetchMembers();
  }

  // Delete member
  async function removeMember(id) {
    await API.delete(`/members/${id}`);
    fetchMembers();
  }

  useEffect(() => {
    fetchMembers();
  }, []);

  {members.map((m) => (
  <div key={m._id} className="flex justify-between p-2 border rounded mb-2">
    <span>{m.firstName} {m.lastName}</span>
    <div className="flex gap-2">
      <Link to={`/members/${m._id}`} className="btn btn-sm btn-info">
        View
      </Link>
      <button className="btn btn-sm btn-error" onClick={() => remove(m._id)}>
        Delete
      </button>
    </div>
  </div>
))}


  return (
    <div className="p-6 bg-white rounded shadow-md w-full">
      <h1 className="text-2xl font-bold mb-4">Class Members</h1>

      {/* Add Member Form */}
      <form onSubmit={addMember} className="flex gap-2 mb-4">
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files[0])}
          className="input input-bordered"
        />
        <button className="btn btn-secondary">Import CSV</button>
        <input
          className="input input-bordered w-1/2"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="First Name"
        />
        <input
          className="input input-bordered w-1/2"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Last Name"
        />
        <button className="btn btn-primary">Add</button>
      </form>

      {/* Members List */}
      <div className="flex flex-col gap-2">
        {members.map((m) => (
          <div
            key={m._id}
            className="flex justify-between items-center p-3 border rounded"
          >
            <span>
              {m.firstName} {m.lastName}
            </span>
            <button
              className="btn btn-sm btn-error"
              onClick={() => removeMember(m._id)}
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex gap-2 mt-4 justify-center">
        <button
          className="btn btn-sm"
          disabled={page === 1}
          onClick={() => fetchMembers(page - 1)}
        >
          Prev
        </button>

        <span className="px-2">
          Page {page} of {totalPages}
        </span>

        <button
          className="btn btn-sm"
          disabled={page === totalPages}
          onClick={() => fetchMembers(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
