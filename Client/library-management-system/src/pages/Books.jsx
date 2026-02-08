import { useState, useEffect } from "react";
import API from "../api/api";
import BookCard from "../components/BookCard.jsx";

export default function Books() {
  const [books, setBooks] = useState([]);
  const [members, setMembers] = useState([]); // To store member list for the picker
  const [selectedBook, setSelectedBook] = useState(null); // Book currently being issued
  const [memberSearch, setMemberSearch] = useState("");
  
  // ... (previous state for title, author, etc. remains the same)

  /** Fetch Members for the Modal */
  const fetchMembers = async () => {
    try {
      const res = await API.get(`/members?search=${memberSearch}`);
      setMembers(res.data.members || []);
    } catch (err) {
      console.error("Failed to fetch members");
    }
  };

  useEffect(() => {
    if (memberSearch.length > 1) fetchMembers();
  }, [memberSearch]);

  /** Modified handleAction */
  const handleAction = async (book) => {
    if (book.status === "issued") {
      // Direct return logic
      try {
        const res = await API.post(`/books/${book._id}/return`);
        alert(res.data.message);
        fetchBooks();
      } catch (err) {
        alert("Return failed");
      }
    } else {
      // Open Member Picker for Issuing
      setSelectedBook(book);
      document.getElementById("member_picker_modal").showModal();
    }
  };

  /** Finalize Issue Transaction */
  const confirmIssue = async (memberId) => {
    try {
      await API.post(`/books/${selectedBook._id}/issue`, { memberId });
      document.getElementById("member_picker_modal").close();
      setSelectedBook(null);
      fetchBooks();
      alert("Book issued successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Issue failed");
    }
  };

  return (
    <div className="p-4">
      {/* ... Existing Title and Add Form ... */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {books.map((book) => (
          <BookCard 
            key={book._id} 
            book={book} 
            onAction={() => handleAction(book)} 
            // ...onEdit, onDelete
          />
        ))}
      </div>

      {/* --- MEMBER PICKER MODAL --- */}
      <dialog id="member_picker_modal" className="modal">
        <div className="modal-box max-w-md">
          <h3 className="font-bold text-lg mb-4">Issue "{selectedBook?.title}"</h3>
          <input 
            type="text" 
            placeholder="Search member by name..." 
            className="input input-bordered w-full mb-4"
            value={memberSearch}
            onChange={(e) => setMemberSearch(e.target.value)}
          />
          
          <div className="max-h-60 overflow-y-auto space-y-2">
            {members.length > 0 ? members.map(m => (
              <div 
                key={m._id} 
                className="flex justify-between items-center p-3 bg-base-200 rounded-lg hover:bg-base-300 cursor-pointer"
                onClick={() => confirmIssue(m._id)}
              >
                <div>
                  <p className="font-medium">{m.firstName} {m.lastName}</p>
                  <p className="text-xs opacity-60">{m.email}</p>
                </div>
                <button className="btn btn-xs btn-primary">Select</button>
              </div>
            )) : <p className="text-center opacity-50">Search for a member...</p>}
          </div>

          <div className="modal-action">
            <button className="btn" onClick={() => document.getElementById("member_picker_modal").close()}>Cancel</button>
          </div>
        </div>
      </dialog>
    </div>
  );
}