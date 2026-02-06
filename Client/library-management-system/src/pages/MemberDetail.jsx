import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/api";

export default function MemberDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // States
  const [member, setMember] = useState(null);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Fetch Member (populated with classId on backend)
        const memberRes = await API.get(`/members/${id}`);
        setMember(memberRes.data);

        // 2. Fetch all classes for the dropdown
        // Note: You might want a specific endpoint for "all" classes without pagination
        const classRes = await API.get("/classes", { params: { limit: 100 } });
        setClasses(classRes.data.data || []);
      } catch (err) {
        console.error(err);
        setMessage({ text: "Failed to load details", type: "error" });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleClassAssignment = async (classId) => {
    try {
      setUpdating(true);
      // We use the PATCH route we discussed earlier
      const res = await API.patch(`/members/${id}`, { classId: classId || null });
      
      setMember(res.data);
      setMessage({ text: "Class updated successfully!", type: "success" });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } catch (err) {
      setMessage({ text: "Failed to update class", type: "error" });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="p-10 text-center"><span className="loading loading-dots loading-lg"></span></div>;
  if (!member) return <div className="p-10 text-center text-error">Member not found.</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm">← Back to Members</button>

      {/* Profile Card */}
      <div className="card bg-base-100 shadow-xl border">
        <div className="card-body">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="card-title text-3xl font-bold">
                {member.firstName} {member.lastName}
              </h2>
              <p className="text-gray-500">{member.email || "No email provided"}</p>
            </div>
            <div className={`badge p-4 ${member.classId ? "badge-primary" : "badge-ghost italic"}`}>
              {member.classId?.name || "Unassigned"}
            </div>
          </div>

          <div className="divider">Assignment</div>

          {/* Class Assignment Section */}
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text font-bold">Assign to a Class</span>
              {updating && <span className="loading loading-spinner loading-xs"></span>}
            </label>
            <select 
              className="select select-bordered w-full"
              value={member.classId?._id || ""}
              onChange={(e) => handleClassAssignment(e.target.value)}
              disabled={updating}
            >
              <option value="">-- No Class (Unassigned) --</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
            <label className="label">
              <span className="label-text-alt text-gray-400">
                Selecting a class will automatically save the member's profile.
              </span>
            </label>
          </div>

          {/* Notifications */}
          {message.text && (
            <div className={`alert ${message.type === "success" ? "alert-success" : "alert-error"} mt-4`}>
              <span>{message.text}</span>
            </div>
          )}
        </div>
      </div>

      {/* History/Stats Placeholder */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <p className="text-xs text-blue-400 uppercase font-bold">Joined On</p>
          <p className="text-lg">{new Date(member.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
          <p className="text-xs text-purple-400 uppercase font-bold">Member ID</p>
          <p className="text-xs font-mono truncate">{member._id}</p>
        </div>
      </div>
    </div>
  );
}