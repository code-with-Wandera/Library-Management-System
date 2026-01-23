import { useEffect, useState } from "react";
import API from "../api/api.js";

export default function Members() {
  const [members, setMembers] = useState([]);
  const [name, setName] = useState("");

  async function fetchMembers() {
    const res = await API.get("/members");
    setMembers(res.data);
  }

  async function addMember(e) {
    e.preventDefault();
    await API.post("/members", { name });
    setName("");
    fetchMembers();
  }

  async function remove(id) {
    await API.delete(`/members/${id}`);
    fetchMembers();
  }

  useEffect(() => {
    fetchMembers();
  }, []);

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Members</h1>

      <form onSubmit={addMember} className="flex gap-2 mb-4">
        <input
          className="input input-bordered"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Member name"
        />
        <button className="btn btn-primary">Add</button>
      </form>

      {members.map((m) => (
        <div key={m._id} className="flex justify-between p-2 border">
          <span>{m.name}</span>
          <button className="btn btn-sm btn-error" onClick={() => remove(m._id)}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
