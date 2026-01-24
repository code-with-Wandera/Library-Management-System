import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../api/api.js";

export default function Profile() {
  const { id } = useParams();
  const [member, setMember] = useState(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    async function fetchMember() {
      const res = await API.get(`/members/${id}`);
      setMember(res.data);
    }
    fetchMember();
  }, [id]);

  async function saveChanges() {
    try {
      const res = await API.put(`/members/${id}`, member);
      setMember(res.data);
      setEditing(false);
      alert("Profile updated");
    } catch (err) {
      alert("Update failed");
    }
  }

  if (!member) return <p>Loading...</p>;

  return (
    <div className="p-6 bg-white rounded shadow-md max-w-lg">
      <h1 className="text-2xl font-bold mb-4">Member Profile</h1>

      {/* First Name */}
      <label className="label">First Name</label>
      <input
        className="input input-bordered w-full mb-2"
        value={member.firstName}
        disabled={!editing}
        onChange={(e) => setMember({ ...member, firstName: e.target.value })}
      />

      {/* Last Name */}
      <label className="label">Last Name</label>
      <input
        className="input input-bordered w-full mb-2"
        value={member.lastName}
        disabled={!editing}
        onChange={(e) => setMember({ ...member, lastName: e.target.value })}
      />

      {/* Email */}
      <label className="label">Email</label>
      <input
        className="input input-bordered w-full mb-2"
        value={member.email || ""}
        disabled={!editing}
        onChange={(e) => setMember({ ...member, email: e.target.value })}
      />
      <label className="label">Class</label>
      <select
        className="select select-bordered w-full"
        disabled={!editing}
        value={member.className || ""}
        onChange={(e) => setMember({ ...member, className: e.target.value })}
      >
        <option value="">Select class</option>
        <option value="S1A">S1A</option>
        <option value="S1B">S1B</option>
        <option value="S2A">S2A</option>
        <option value="S2B">S2B</option>
      </select>

      {/* Buttons */}
      <div className="flex gap-2 mt-4">
        {!editing ? (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setEditing(true)}
          >
            Edit
          </button>
        ) : (
          <button className="btn btn-success btn-sm" onClick={saveChanges}>
            Save
          </button>
        )}

        <Link to="/members" className="btn btn-outline btn-sm">
          Back
        </Link>
      </div>
    </div>
  );
}
