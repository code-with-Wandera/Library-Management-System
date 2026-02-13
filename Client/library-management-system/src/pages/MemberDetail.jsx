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

  const handlePayment = async () => {
    const amount = window.prompt(
      `Total Owed: $${member.totalFines}. Enter amount paid:`,
    );

    if (!amount || isNaN(amount) || amount <= 0) return;

    try {
      setUpdating(true);
      const res = await API.patch(`/members/${id}/pay-fine`, {
        amount: Number(amount),
      });

      // Update local state so the UI reflects the new balance immediately
      setMember({ ...member, totalFines: res.remainingBalance });
      setMessage({ text: `Payment of $${amount} recorded!`, type: "success" });
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || "Payment failed",
        type: "error",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleClassAssignment = async (classId) => {
    try {
      setUpdating(true);
      // We use the PATCH route we discussed earlier
      const res = await API.patch(`/members/${id}`, {
        classId: classId || null,
      });

      setMember(res.data);
      setMessage({ text: "Class updated successfully!", type: "success" });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } catch (err) {
      setMessage({ text: "Failed to update class", type: "error" });
    } finally {
      setUpdating(false);
    }
  };

  if (loading)
    return (
      <div className="p-10 text-center">
        <span className="loading loading-dots loading-lg"></span>
      </div>
    );
  if (!member)
    return <div className="p-10 text-center text-error">Member not found.</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm">
        ← Back to Members
      </button>

      {/* Profile Card */}
      <div className="card bg-base-100 shadow-xl border">
        <div className="card-body">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="card-title text-3xl font-bold">
                {member.firstName} {member.lastName}
              </h2>
              <p className="text-gray-500">
                {member.email || "No email provided"}
              </p>
            </div>
            <div
              className={`badge p-4 ${member.classId ? "badge-primary" : "badge-ghost italic"}`}
            >
              {member.classId?.name || "Unassigned"}
            </div>
          </div>

          {/* Active Loans Section */}
          <div className="card bg-base-100 shadow-xl border mt-6">
            <div className="card-body">
              <h3 className="card-title text-xl font-bold mb-4">
                Current Active Loans
              </h3>
              {member.activeLoans && member.activeLoans.length > 0 ? (
                <div className="space-y-3">
                  {member.activeLoans.map((book) => (
                    <div
                      key={book._id}
                      className="flex justify-between items-center p-3 bg-base-200 rounded-xl"
                    >
                      <div>
                        <p className="font-bold">{book.title}</p>
                        <p className="text-xs opacity-50">
                          Due: {new Date(book.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div
                        className={`badge ${new Date() > new Date(book.dueDate) ? "badge-error" : "badge-success"}`}
                      >
                        {new Date() > new Date(book.dueDate)
                          ? "Overdue"
                          : "On Time"}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 italic">
                  No books currently borrowed.
                </p>
              )}
            </div>
          </div>

          <div className="divider">Assignment</div>

          {/* Class Assignment Section */}
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text font-bold">Assign to a Class</span>
              {updating && (
                <span className="loading loading-spinner loading-xs"></span>
              )}
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

          {/* fine card */}
          <div className="grid grid-cols-3 gap-4">
            {/* Joined Date */}
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <p className="text-xs text-blue-400 uppercase font-bold">
                Joined
              </p>
              <p className="text-lg font-bold">
                {new Date(member.createdAt).toLocaleDateString()}
              </p>
            </div>

            {/* Total Fines Card */}
            <div
              className={`p-4 rounded-xl border transition-all ${member.totalFines > 0 ? "bg-red-50 border-red-100" : "bg-green-50 border-green-100"}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p
                    className={`text-xs uppercase font-bold ${member.totalFines > 0 ? "text-red-400" : "text-green-400"}`}
                  >
                    Total Fines
                  </p>
                  <p className="text-2xl font-black">
                    ${member.totalFines.toFixed(2)}
                  </p>
                </div>
                {member.totalFines > 0 && (
                  <button
                    onClick={handlePayment}
                    className="btn btn-xs btn-error text-white rounded-lg"
                  >
                    Pay
                  </button>
                )}
              </div>
            </div>

            {/* Member ID */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <p className="text-xs text-gray-400 uppercase font-bold">
                System ID
              </p>
              <p className="text-xs font-mono truncate">
                {member.memberId || member._id}
              </p>
            </div>
          </div>

          {/* Notifications */}
          {message.text && (
            <div
              className={`alert ${message.type === "success" ? "alert-success" : "alert-error"} mt-4`}
            >
              <span>{message.text}</span>
            </div>
          )}
        </div>
      </div>

      {/* History/Stats Placeholder */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <p className="text-xs text-blue-400 uppercase font-bold">Joined On</p>
          <p className="text-lg">
            {new Date(member.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
          <p className="text-xs text-purple-400 uppercase font-bold">
            Member ID
          </p>
          <p className="text-xs font-mono truncate">{member._id}</p>
        </div>
      </div>
    </div>
  );
}
