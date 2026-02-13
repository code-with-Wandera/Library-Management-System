import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/api";

export default function MemberDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // States
  const [member, setMember] = useState(null);
  const [classes, setClasses] = useState([]);
  const [transactions, setTransactions] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. Fetch Member
        const memberRes = await API.get(`/members/${id}`);
        setMember(memberRes.data);

        // 2. Fetch Classes
        const classRes = await API.get("/classes", { params: { limit: 100 } });
        setClasses(classRes.data?.data || []);

        // 3. Fetch Transactions 
        const txRes = await API.get(`/members/${id}/transactions`);
        setTransactions(txRes.data || []);
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
      `Total Owed: $${member.totalFines}. Enter amount paid:`
    );

    if (!amount || isNaN(amount) || amount <= 0) return;

    try {
      setUpdating(true);
      const res = await API.patch(`/members/${id}/pay-fine`, {
        amount: Number(amount),
      });

      // correct response access
      setMember({ ...member, totalFines: res.data.remainingBalance });

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

      <div className="card bg-base-100 shadow-xl border">
        <div className="card-body">
          <h2 className="card-title text-3xl font-bold">
            {member.firstName} {member.lastName}
          </h2>

          {/* Financial History */}
          <div className="mt-6">
            <h3 className="font-bold mb-2">Financial History</h3>
            <table className="table table-zebra w-full">
              <tbody>
                {transactions.length > 0 ? (
                  transactions.map((tx) => (
                    <tr key={tx._id}>
                      <td>{new Date(tx.createdAt).toLocaleDateString()}</td>
                      <td>{tx.type}</td>
                      <td>{tx.description}</td>
                      <td className="text-right">
                        ${tx.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center italic opacity-50">
                      No financial history found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Class Assignment */}
          <div className="form-control mt-6">
            <label className="label">
              <span className="label-text font-bold">Assign to a Class</span>
            </label>
            <select
              className="select select-bordered"
              value={member.classId?._id || ""}
              onChange={(e) => handleClassAssignment(e.target.value)}
              disabled={updating}
            >
              <option value="">-- No Class --</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Total Fines */}
          <div className="mt-6">
            <p className="font-bold">Total Fines</p>
            <p className="text-2xl">${member.totalFines.toFixed(2)}</p>
            {member.totalFines > 0 && (
              <button
                onClick={handlePayment}
                className="btn btn-error btn-sm mt-2"
              >
                Pay
              </button>
            )}
          </div>

          {message.text && (
            <div
              className={`alert mt-4 ${
                message.type === "success"
                  ? "alert-success"
                  : "alert-error"
              }`}
            >
              {message.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}