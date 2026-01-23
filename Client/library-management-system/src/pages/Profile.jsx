
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../api/api.js";

export default function Profile() {
  const { id } = useParams(); // get member ID from route
  const [member, setMember] = useState(null);

  useEffect(() => {
    async function fetchMember() {
      try {
        const res = await API.get(`/members/${id}`);
        setMember(res.data);
      } catch (err) {
        console.error("Failed to fetch member:", err);
      }
    }

    fetchMember();
  }, [id]);

  if (!member) return <p>Loading member info...</p>;

  return (
    <div className="p-6 bg-white rounded shadow-md">
      <h1 className="text-2xl font-bold mb-4">
        {member.firstName} {member.lastName}
      </h1>

      <div className="mb-2">
        <strong>First Name:</strong> {member.firstName}
      </div>
      <div className="mb-2">
        <strong>Last Name:</strong> {member.lastName}
      </div>
      <div className="mb-2">
        <strong>Email:</strong> {member.email || "N/A"}
      </div>
      <div className="mb-2">
        <strong>Class:</strong> {member.className || "N/A"}
      </div>

      <Link to="/members" className="btn btn-sm btn-outline mt-4">
        Back to Members
      </Link>
    </div>
  );
}
