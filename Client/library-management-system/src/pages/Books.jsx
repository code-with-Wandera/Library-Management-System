import { useState, useEffect } from "react";
import BookCard from "../components/BookCard.jsx";
import API from "../api/api";

export default function Books() {
  const [books, setBooks] = useState([]);
  const [editingBook, setEditingBook] = useState(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAuthor, setSelectedAuthor] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Pagination
  const booksPerPage = 6;
  const [page, setPage] = useState(1);

  /** Fetch all books */
  async function fetchBooks() {
    try {
      setLoading(true);
      setError("");
      const res = await API.get("/books");
      setBooks(res.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch books.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBooks();
  }, []);

  /** Add a new book */
  async function handleAdd(e) {
    e.preventDefault();
    if (!title.trim() || !author.trim()) return alert("All fields required");

    try {
      const newBook = { title: title.trim(), author: author.trim(), isBorrowed: false };
      const res = await API.post("/books", newBook);
      setBooks((prev) => [res.data, ...prev]);
      setTitle("");
      setAuthor("");
      setPage(1);
    } catch (err) {
      console.error(err);
      alert("Failed to add book");
    }
  }

  /** Open edit modal */
  function openEdit(book) {
    setEditingBook(book);
    setTitle(book.title);
    setAuthor(book.author);
    document.getElementById("edit_modal").showModal();
  }

  /** Update a book */
  async function handleUpdate() {
    if (!title.trim() || !author.trim()) return alert("All fields required");

    try {
      const updatedBook = { ...editingBook, title: title.trim(), author: author.trim() };
      const res = await API.put(`/books/${editingBook._id}`, updatedBook);
      setBooks((prev) =>
        prev.map((b) => (b._id === res.data._id ? res.data : b))
      );
      document.getElementById("edit_modal").close();
    } catch (err) {
      console.error(err);
      alert("Failed to update book");
    }
  }

  /** Delete a book */
  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this book?")) return;
    try {
      await API.delete(`/books/${id}`);
      setBooks((prev) => prev.filter((b) => b._id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete book");
    }
  }

  /** Toggle borrow status */
  async function handleToggleBorrow(book) {
    try {
      const updatedBook = { ...book, isBorrowed: !book.isBorrowed };
      const res = await API.put(`/books/${book._id}`, updatedBook);
      setBooks((prev) =>
        prev.map((b) => (b._id === res.data._id ? res.data : b))
      );
    } catch (err) {
      console.error(err);
      alert("Failed to update book status");
    }
  }

  // Filter logic
  const authors = ["all", ...new Set(books.map((b) => b.author))];
  const filteredBooks = books.filter((book) => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAuthor = selectedAuthor === "all" || book.author === selectedAuthor;
    return matchesSearch && matchesAuthor;
  });

  // Pagination
  const totalPages = Math.ceil(filteredBooks.length / booksPerPage);
  const paginatedBooks = filteredBooks.slice(
    (page - 1) * booksPerPage,
    page * booksPerPage
  );

  useEffect(() => {
    if (page > totalPages) setPage(totalPages || 1);
  }, [filteredBooks, totalPages, page]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Books</h1>

      {/* Add Book */}
      <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-2 mb-6">
        <input
          className="input input-bordered w-full md:w-1/3"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className="input input-bordered w-full md:w-1/3"
          placeholder="Author"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
        />
        <button type="submit" className="btn btn-primary md:w-1/6">
          Add Book
        </button>
      </form>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by title..."
          className="input input-bordered w-full md:w-1/2"
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
        />
        <select
          className="select select-bordered w-full md:w-1/4"
          value={selectedAuthor}
          onChange={(e) => { setSelectedAuthor(e.target.value); setPage(1); }}
        >
          {authors.map((author) => (
            <option key={author} value={author}>{author}</option>
          ))}
        </select>
      </div>

      {loading && <p>Loading books...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && filteredBooks.length === 0 && <p className="text-gray-500">No books found.</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {paginatedBooks.map((book) => (
          <BookCard
            key={book._id}
            book={book}
            onDelete={handleDelete}
            onEdit={openEdit}
            onToggleBorrow={handleToggleBorrow}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6 flex-wrap">
          <button className="btn btn-sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              className={`btn btn-sm ${num === page ? "btn-primary" : "btn-outline"}`}
              onClick={() => setPage(num)}
            >
              {num}
            </button>
          ))}
          <button className="btn btn-sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}

      {/* Edit Modal */}
      <dialog id="edit_modal" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Edit Book</h3>
          <div className="space-y-4 mt-4">
            <input className="input input-bordered w-full" value={title} onChange={(e) => setTitle(e.target.value)} />
            <input className="input input-bordered w-full" value={author} onChange={(e) => setAuthor(e.target.value)} />
          </div>
          <div className="modal-action">
            <button className="btn btn-primary" onClick={handleUpdate}>Save</button>
            <button className="btn" onClick={() => document.getElementById("edit_modal").close()}>Cancel</button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
