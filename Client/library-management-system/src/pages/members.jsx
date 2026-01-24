import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/api.js";

export default function Members() {
  const [members, setMembers] = useState([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [file, setFile] = useState(null);

  // Fetch members
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

  // Add member ✅
  async function addMember(e) {
    e.preventDefault();
    if (!firstName || !lastName) {
      alert("Both names required");
      return;
    }

    try {
      await API.post("/members", { firstName, lastName });
      setFirstName("");
      setLastName("");
      fetchMembers(1);
    } catch (err) {
      console.error(err);
      alert("Failed to add member");
    }
  }

  // Delete member
  async function removeMember(id) {
    await API.delete(`/members/${id}`);
    fetchMembers();
  }

  // Upload CSV ✅
  async function uploadCSV(e) {
    e.preventDefault();
    if (!file) return alert("Select a CSV file");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await API.post("/members/import", formData);
      alert(res.data.message);
      setFile(null);
      fetchMembers();
    } catch (err) {
      console.error(err);
      alert("CSV import failed");
    }
  }

  useEffect(() => {
    fetchMembers();
  }, []);

  return (
    <div className="p-6 bg-white rounded shadow-md w-full">
      <h1 className="text-2xl font-bold mb-4">Class Members</h1>

      {/* Add Member + CSV */}
      <form className="flex gap-2 mb-4 flex-wrap">
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files[0])}
          className="input input-bordered"
        />
        <button onClick={uploadCSV} className="btn btn-secondary">
          Import CSV
        </button>

        <input
          className="input input-bordered"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="First Name"
        />
        <input
          className="input input-bordered"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Last Name"
        />

        <button onClick={addMember} className="btn btn-primary">
          Add
        </button>
      </form>

      {/* Members List */}
      <div className="flex flex-col gap-2">
        {members.map((m) => (
          <div
            key={m._id}
            className="flex justify-between items-center p-3 border rounded"
          >
            <span>{m.firstName} {m.lastName}</span>

            <div className="flex gap-2">
              <Link
                to={`/members/${m._id}`}
                className="btn btn-sm btn-info"
              >
                View
              </Link>
              <button
                className="btn btn-sm btn-error"
                onClick={() => removeMember(m._id)}
              >
                Delete
              </button>
            </div>
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

        <span>Page {page} of {totalPages}</span>

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
