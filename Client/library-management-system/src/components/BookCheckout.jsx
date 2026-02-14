import { useState, useEffect } from "react";
import API from "../api/api";
import { useParams, useNavigate } from "react-router-dom";

export default function BookCheckout() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  
  const [book, setBook] = useState(null);
  const [members, setMembers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch book details and member list for the dropdown
    const loadData = async () => {
      const [bookRes, memberRes] = await Promise.all([
        API.get(`/books/${bookId}`),
        API.get("/members", { params: { limit: 1000 } }) 
      ]);
      setBook(bookRes.data);
      setMembers(memberRes.data.members);
    };
    loadData();
  }, [bookId]);

  // --- INJECTED LOGIC START ---
  const handleBorrow = async (e) => {
    e.preventDefault();
    if (!selectedMemberId) return alert("Please select a member");

    const defaultDueDate = new Date();
    defaultDueDate.setDate(defaultDueDate.getDate() + 14); // 2 weeks from now

    try {
      setLoading(true);
      await API.post("/borrow", {
        memberId: selectedMemberId,
        bookId: bookId,
        dueDate: defaultDueDate
      });
      
      alert("Book issued successfully!");
      navigate("/books"); // Go back to catalog
    } catch (err) {
      alert(err.response?.data?.error || "Checkout failed");
    } finally {
      setLoading(false);
    }
  };
  // --- INJECTED LOGIC END ---

  if (!book) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-xl rounded-2xl border mt-10">
      <h2 className="text-2xl font-bold mb-4">Checkout Book</h2>
      <div className="bg-indigo-50 p-4 rounded-lg mb-6">
        <p className="font-bold text-indigo-800">{book.title}</p>
        <p className="text-sm text-indigo-600">ISBN: {book.isbn}</p>
      </div>

      <form onSubmit={handleBorrow} className="space-y-4">
        <div className="form-control">
          <label className="label font-semibold">Select Member</label>
          <select 
            className="select select-bordered w-full"
            value={selectedMemberId}
            onChange={(e) => setSelectedMemberId(e.target.value)}
            required
          >
            <option value="">Choose a member...</option>
            {members.map(m => (
              <option key={m._id} value={m._id}>
                {m.firstName} {m.lastName}
              </option>
            ))}
          </select>
        </div>

        <div className="p-3 bg-gray-50 rounded-md text-xs text-gray-500">
          Standard loan period: 14 days. 
          Due Date: {new Date(new Date().setDate(new Date().getDate() + 14)).toLocaleDateString()}
        </div>

        <button 
          type="submit" 
          className={`btn btn-primary btn-block ${loading ? 'loading' : ''}`}
          disabled={!book.available || loading}
        >
          {book.available ? "Confirm Checkout" : "Book Already Borrowed"}
        </button>
      </form>
    </div>
  );
}