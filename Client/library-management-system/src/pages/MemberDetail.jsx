import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/api";
import { jsPDF } from "jspdf";

// --- SUB-COMPONENT: FINANCIAL LEDGER ---
const FinancialHistory = ({ transactions }) => {
  return (
    <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-700">
        📑 Financial Ledger
      </h3>
      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-gray-600">Date</th>
              <th className="text-gray-600">Type</th>
              <th className="text-gray-600">Description</th>
              <th className="text-right text-gray-600">Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t._id} className="hover">
                <td className="text-sm">
                  {new Date(t.createdAt).toLocaleDateString()}
                </td>
                <td>
                  <span className={`badge badge-sm font-semibold ${
                    t.type === 'fine_incurred' ? 'badge-error' : 'badge-success'
                  }`}>
                    {t.type === 'fine_incurred' ? 'Fine' : 'Payment'}
                  </span>
                </td>
                <td className="text-sm text-gray-600">{t.description}</td>
                <td className={`text-right font-mono font-bold ${
                  t.type === 'fine_incurred' ? 'text-red-600' : 'text-green-600'
                }`}>
                  {t.type === 'fine_incurred' ? `+` : `-`}
                  ${t.amount.toFixed(2)}
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan="4" className="text-center py-8 opacity-50 italic">
                  No financial history found for this member.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default function MemberDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // --- STATES ---
  const [member, setMember] = useState(null);
  const [classes, setClasses] = useState([]);
  const [transactions, setTransactions] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  // --- DATA FETCHING ---
  const fetchTransactions = useCallback(async () => {
    try {
      const txRes = await API.get(`/members/${id}/transactions`);
      setTransactions(txRes.data || []);
    } catch (err) {
      console.error("Failed to fetch transactions", err);
    }
  }, [id]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [memberRes, classRes] = await Promise.all([
          API.get(`/members/${id}`),
          API.get("/classes", { params: { limit: 100 } })
        ]);

        setMember(memberRes.data);
        setClasses(classRes.data?.data || []);
        await fetchTransactions();
      } catch (err) {
        setMessage({ text: "Failed to load member details", type: "error" });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, fetchTransactions]);

  // --- RECEIPT GENERATION (PDF) ---
  const generateReceipt = (paymentAmount, remainingBalance) => {
    const doc = new jsPDF({
      unit: "mm",
      format: [80, 150], // Receipt Printer Format
    });

    const date = new Date().toLocaleString();
    doc.setFontSize(12);
    doc.text("LIB-SYS RECEIPT", 40, 15, { align: "center" });
    doc.setFontSize(8);
    doc.text("------------------------------------------", 40, 20, { align: "center" });
    
    doc.text(`Date: ${date}`, 10, 30);
    doc.text(`Member: ${member.firstName} ${member.lastName}`, 10, 35);
    doc.text(`Member ID: ${member.memberId || id.substring(0,8)}`, 10, 40);
    
    doc.setFontSize(10);
    doc.text(`PAID AMOUNT: $${paymentAmount.toFixed(2)}`, 10, 55);
    doc.text(`REMAINING: $${remainingBalance.toFixed(2)}`, 10, 62);
    
    doc.setFontSize(8);
    doc.text("------------------------------------------", 40, 75, { align: "center" });
    doc.text("Thank you for using our library!", 40, 82, { align: "center" });

    doc.save(`Receipt_${member.lastName}_${Date.now()}.pdf`);
  };

  // --- PAYMENT LOGIC ---
  const handlePayment = async () => {
    const amountStr = window.prompt(
      `Total Owed: $${member.totalFines.toFixed(2)}. Enter amount paid:`
    );

    if (!amountStr || isNaN(amountStr) || Number(amountStr) <= 0) return;
    const amount = Number(amountStr);

    if (amount > member.totalFines) {
        alert("Payment cannot exceed total fine amount.");
        return;
    }

    try {
      setUpdating(true);
      const res = await API.patch(`/members/${id}/pay-fine`, { amount });

      const newBalance = res.data.remainingBalance;
      setMember({ ...member, totalFines: newBalance });
      
      // Update the ledger
      await fetchTransactions();

      setMessage({ text: `Payment of $${amount.toFixed(2)} recorded!`, type: "success" });
      
      if (window.confirm("Payment successful! Would you like to download a receipt?")) {
        generateReceipt(amount, newBalance);
      }
      
      setTimeout(() => setMessage({ text: "", type: "" }), 5000);
    } catch (err) {
      setMessage({ text: "Payment processing failed", type: "error" });
    } finally {
      setUpdating(false);
    }
  };

  // --- CLASS ASSIGNMENT ---
  const handleClassAssignment = async (classId) => {
    try {
      setUpdating(true);
      const res = await API.patch(`/members/${id}`, { classId: classId || null });
      setMember(res.data);
      setMessage({ text: "Class assignment updated!", type: "success" });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } catch (err) {
      setMessage({ text: "Failed to update class", type: "error" });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <span className="loading loading-spinner loading-lg text-primary"></span>
    </div>
  );

  if (!member) return <div className="p-10 text-center text-error">Member data not found.</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 animate-fadeIn">
      <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm gap-2">
        ← Back to Members List
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Profile & History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card bg-white shadow-sm border border-gray-100">
            <div className="card-body">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-4xl font-extrabold text-gray-900">
                    {member.firstName} {member.lastName}
                  </h1>
                  <p className="text-gray-500 mt-1">{member.email || "No email provided"}</p>
                </div>
                <div className="badge badge-lg badge-outline opacity-50">Member Detail</div>
              </div>

              <div className="divider"></div>

              <div className="form-control w-full max-w-xs">
                <label className="label">
                  <span className="label-text font-bold text-gray-700">Class Assignment</span>
                </label>
                <select
                  className="select select-bordered select-md bg-gray-50"
                  value={member.classId?._id || ""}
                  onChange={(e) => handleClassAssignment(e.target.value)}
                  disabled={updating}
                >
                  <option value="">-- No Class Assigned --</option>
                  {classes.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <FinancialHistory transactions={transactions} />
        </div>

        {/* RIGHT COLUMN: Action Sidebar */}
        <div className="space-y-6">
          <div className={`card shadow-2xl transition-all duration-300 ${
            member.totalFines > 0 ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
          }`}>
            <div className="card-body">
              <h3 className="font-bold uppercase text-xs tracking-widest opacity-80">Outstanding Balance</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black">${member.totalFines.toFixed(2)}</span>
              </div>
              
              <div className="card-actions mt-6">
                {member.totalFines > 0 ? (
                  <button
                    onClick={handlePayment}
                    disabled={updating}
                    className="btn btn-block bg-white text-red-600 border-none hover:bg-gray-100 font-bold"
                  >
                    {updating ? "Processing..." : "Process Payment"}
                  </button>
                ) : (
                  <div className="text-sm font-medium bg-white/20 p-3 rounded-lg w-full text-center">
                    ✅ Account Clear
                  </div>
                )}
              </div>
            </div>
          </div>

          {message.text && (
            <div className={`alert shadow-lg ${message.type === "success" ? "alert-success" : "alert-error"}`}>
              <div className="flex gap-2">
                <span>{message.text}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}