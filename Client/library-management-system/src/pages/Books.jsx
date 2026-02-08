import { useState, useEffect, useMemo } from "react";
import API from "../api/api";
import BookCard from "../components/BookCard.jsx";

export default function Books() {
  // --- STATE MANAGEMENT ---
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  
  // Navigation
  const [activeLevel, setActiveLevel] = useState("Primary");
  const [selectedSubject, setSelectedSubject] = useState(null);

  // Modals & Receipts
  const [receipt, setReceipt] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [members, setMembers] = useState([]);
  const [memberSearch, setMemberSearch] = useState("");

  // Form State
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ title: "", author: "", genre: "" });

  const academicLevels = ["Primary", "Secondary", "College", "University", "Non-academic"];

  // --- DATA FETCHING ---
  const fetchBooks = async () => {
    try {
      setLoading(true);
      const res = await API.get("/books");
      setBooks(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Fetch Books Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await API.get(`/members?search=${memberSearch}`);
      setMembers(res.data.members || []);
    } catch (err) {
      console.error("Fetch Members Error:", err);
    }
  };

  useEffect(() => { fetchBooks(); }, []);
  useEffect(() => {
    if (memberSearch.length > 1) fetchMembers();
  }, [memberSearch]);

  // --- COMPUTED LOGIC (Performance Optimized) ---
  const filteredBySearch = useMemo(() => {
    return books.filter(b => 
      b.title.toLowerCase().includes(globalSearch.toLowerCase()) ||
      b.author.toLowerCase().includes(globalSearch.toLowerCase())
    );
  }, [books, globalSearch]);

  const levelBooks = useMemo(() => 
    books.filter(b => b.academicLevel === activeLevel), 
  [books, activeLevel]);

  const subjects = useMemo(() => 
    [...new Set(levelBooks.map(b => b.genre || "General"))], 
  [levelBooks]);

  const stats = useMemo(() => ({
    total: levelBooks.length,
    available: levelBooks.filter(b => b.status === "available").length,
    issued: levelBooks.filter(b => b.status === "issued").length
  }), [levelBooks]);

  // --- HANDLERS ---
  const handleAction = async (book) => {
    if (book.status === "issued") {
      try {
        const res = await API.post(`/books/${book._id}/return`);
        if (res.data.fine > 0) {
          setReceipt({
            title: book.title,
            borrower: book.borrowedBy ? `${book.borrowedBy.firstName} ${book.borrowedBy.lastName}` : "Unknown",
            fine: res.data.fine,
            level: book.academicLevel
          });
          document.getElementById("fine_receipt_modal").showModal();
        } else {
          alert("Return successful!");
        }
        fetchBooks();
      } catch (err) {
        alert("Return operation failed.");
      }
    } else {
      setSelectedBook(book);
      document.getElementById("member_picker_modal").showModal();
    }
  };

  const confirmIssue = async (memberId) => {
    try {
      await API.post(`/books/${selectedBook._id}/issue`, { memberId });
      document.getElementById("member_picker_modal").close();
      setSelectedBook(null);
      fetchBooks();
    } catch (err) {
      alert(err.response?.data?.message || "Issue failed");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, academicLevel: activeLevel };
    try {
      if (editingId) {
        await API.put(`/books/${editingId}`, payload);
      } else {
        await API.post("/books", payload);
      }
      document.getElementById('add_book_modal').close();
      resetForm();
      fetchBooks();
    } catch (err) {
      alert("Save failed. Please check your connection.");
    }
  };

  const handleEdit = (book) => {
    setEditingId(book._id);
    setForm({ title: book.title, author: book.author, genre: book.genre });
    document.getElementById('add_book_modal').showModal();
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ title: "", author: "", genre: "" });
  };

  const deleteBook = async (id) => {
    if (!window.confirm("Delete this book permanently?")) return;
    try {
      await API.delete(`/books/${id}`);
      fetchBooks();
    } catch (err) { alert("Delete failed"); }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-base-100 font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-full md:w-64 bg-base-200 p-5 border-r border-base-300">
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="bg-primary p-2 rounded-lg text-white">📚</div>
          <h2 className="text-xl font-black tracking-tight">LIB-SYS</h2>
        </div>
        <ul className="menu menu-md p-0 gap-2">
          <p className="text-[10px] font-bold opacity-40 mb-1 ml-4 uppercase tracking-widest">Sectors</p>
          {academicLevels.map(level => (
            <li key={level}>
              <button 
                className={`rounded-xl font-medium ${activeLevel === level && !globalSearch ? "active bg-primary text-white" : ""}`}
                onClick={() => { setActiveLevel(level); setSelectedSubject(null); setGlobalSearch(""); }}
              >
                {level}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8 flex flex-col">
        {/* TOP BAR */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-8">
          <div className="relative w-full lg:max-w-md">
            <input 
              type="text" 
              placeholder="Search across all books..." 
              className="input input-bordered w-full pl-10 bg-base-200 border-none focus:ring-2 ring-primary"
              value={globalSearch}
              onChange={(e) => { setGlobalSearch(e.target.value); if(e.target.value) setSelectedSubject(null); }}
            />
            <span className="absolute left-3 top-3.5 opacity-30">🔍</span>
          </div>
          <button className="btn btn-primary shadow-lg shadow-primary/20 px-8 rounded-xl" onClick={() => { resetForm(); document.getElementById('add_book_modal').showModal() }}>
            + Add New Book
          </button>
        </div>

        {/* VIEW AREA */}
        <section className="flex-1">
          {loading ? (
            <div className="flex justify-center items-center h-64"><span className="loading loading-spinner loading-lg text-primary"></span></div>
          ) : globalSearch ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in duration-500">
              {filteredBySearch.map(book => <BookCard key={book._id} book={book} onEdit={() => handleEdit(book)} onAction={() => handleAction(book)} onDelete={() => deleteBook(book._id)} />)}
            </div>
          ) : !selectedSubject ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {subjects.map(sub => (
                <div key={sub} onClick={() => setSelectedSubject(sub)} className="group cursor-pointer bg-base-200 p-8 rounded-3xl border-2 border-transparent hover:border-primary hover:bg-base-100 transition-all text-center shadow-sm hover:shadow-xl">
                  <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">📂</div>
                  <h3 className="font-bold text-lg leading-tight">{sub}</h3>
                  <p className="text-xs font-bold opacity-40 mt-2 uppercase">{levelBooks.filter(b => b.genre === sub).length} items</p>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-4 mb-8">
                <button className="btn btn-circle btn-sm btn-ghost border border-base-300" onClick={() => setSelectedSubject(null)}>←</button>
                <h2 className="text-2xl font-black">{selectedSubject}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {displayedBooks.map(book => <BookCard key={book._id} book={book} onEdit={() => handleEdit(book)} onAction={() => handleAction(book)} onDelete={() => deleteBook(book._id)} />)}
              </div>
            </div>
          )}
        </section>

        {/* STATS FOOTER */}
        <footer className="mt-12">
          <div className="stats shadow bg-base-200 w-full rounded-3xl">
            <div className="stat">
              <div className="stat-title">Current Sector</div>
              <div className="stat-value text-primary">{activeLevel}</div>
              <div className="stat-desc">{stats.total} Total Books</div>
            </div>
            <div className="stat">
              <div className="stat-title">Inventory</div>
              <div className="stat-value text-success">{stats.available}</div>
              <div className="stat-desc">Available to Borrow</div>
            </div>
            <div className="stat">
              <div className="stat-title">In Circulation</div>
              <div className="stat-value text-warning">{stats.issued}</div>
              <div className="stat-desc">Currently with Members</div>
            </div>
          </div>
        </footer>
      </main>

      {/* --- MODALS --- */}
      
      {/* ADD/EDIT MODAL */}
      <dialog id="add_book_modal" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box rounded-3xl">
          <h3 className="font-black text-2xl mb-2">{editingId ? "Edit Book" : "New Entry"}</h3>
          <p className="text-sm opacity-50 mb-6">Assigning to {activeLevel} Sector</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input className="input input-bordered w-full rounded-xl" placeholder="Book Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
            <input className="input input-bordered w-full rounded-xl" placeholder="Author Name" value={form.author} onChange={e => setForm({...form, author: e.target.value})} required />
            <input className="input input-bordered w-full rounded-xl" placeholder="Subject (e.g. Science)" value={form.genre} onChange={e => setForm({...form, genre: e.target.value})} required />
            <div className="modal-action">
              <button type="submit" className="btn btn-primary rounded-xl px-10">Save Record</button>
              <button type="button" className="btn btn-ghost rounded-xl" onClick={() => document.getElementById('add_book_modal').close()}>Cancel</button>
            </div>
          </form>
        </div>
      </dialog>

      {/* FINE RECEIPT MODAL */}
      <dialog id="fine_receipt_modal" className="modal">
        <div className="modal-box border-t-8 border-error rounded-3xl">
          <h3 className="font-black text-2xl text-error mb-6">Overdue Fine</h3>
          <div className="space-y-4 py-4 border-y border-base-200">
            <div className="flex justify-between"><span className="opacity-50">Book:</span><span className="font-bold">{receipt?.title}</span></div>
            <div className="flex justify-between"><span className="opacity-50">Member:</span><span className="font-bold">{receipt?.borrower}</span></div>
            <div className="flex justify-between items-center pt-4"><span className="text-lg font-bold">Penalty Total:</span><span className="text-3xl font-black text-error">${receipt?.fine}.00</span></div>
          </div>
          <div className="modal-action">
            <button className="btn btn-error w-full rounded-xl" onClick={() => { window.print(); document.getElementById("fine_receipt_modal").close(); }}>Print Receipt</button>
          </div>
        </div>
      </dialog>

      {/* MEMBER PICKER MODAL */}
      <dialog id="member_picker_modal" className="modal">
        <div className="modal-box rounded-3xl">
          <h3 className="font-black text-xl mb-4 text-center">Issue Book</h3>
          <input type="text" placeholder="Search member name..." className="input input-bordered w-full mb-6 rounded-xl" value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} />
          <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
            {members.map(m => (
              <div key={m._id} className="flex justify-between items-center p-4 bg-base-200 rounded-2xl hover:bg-primary hover:text-white cursor-pointer transition-all" onClick={() => confirmIssue(m._id)}>
                <div><p className="font-bold">{m.firstName} {m.lastName}</p><p className="text-xs opacity-60">{m.email}</p></div>
                <div className="badge badge-outline font-bold">Select</div>
              </div>
            ))}
          </div>
          <div className="modal-action"><button className="btn btn-ghost w-full" onClick={() => document.getElementById('member_picker_modal').close()}>Close</button></div>
        </div>
      </dialog>
    </div>
  );
}