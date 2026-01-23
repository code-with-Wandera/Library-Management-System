import { useState, useEffect } from "react";
import BookCard from "../components/BookCard";
import API from "../api/api";

export default function Books({ books, setBooks, onDelete, onEdit }) {
  const [editingBook, setEditingBook] = useState(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAuthor, setSelectedAuthor] = useState("all");

  // Pagination
  const booksPerPage = 6;
  const [page, setPage] = useState(1);

  function openEdit(book) {
    setEditingBook(book);
    setTitle(book.title);
    setAuthor(book.author);
    document.getElementById("edit_modal").showModal();
  }

  async function handleUpdate() {
    const updatedBook = { ...editingBook, title, author };
    try {
      await API.put(`/books/${editingBook.id}`, updatedBook);
      onEdit(updatedBook);
      document.getElementById("edit_modal").close();
    } catch (err) {
      console.error("Failed to update book:", err);
      alert("Failed to update book");
    }
  }

  // Filter logic
  const authors = ["all", ...new Set(books.map((b) => b.author))];

  const filteredBooks = books.filter((book) => {
    const matchesSearch = book.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesAuthor =
      selectedAuthor === "all" || book.author === selectedAuthor;
    return matchesSearch && matchesAuthor;
  });

  // Pagination
  const totalPages = Math.ceil(filteredBooks.length / booksPerPage);
  const paginatedBooks = filteredBooks.slice(
    (page - 1) * booksPerPage,
    page * booksPerPage
  );

  useEffect(() => {
    if (filteredBooks.length > 0 && page > totalPages) {
      setPage(totalPages);
    }
  }, [filteredBooks, totalPages, page]);

  // Toggle Borrowed / Available
  async function handleToggleBorrow(book) {
    const updatedBook = { ...book, isBorrowed: !book.isBorrowed };
    try {
      await API.put(`/books/${book.id}`, updatedBook);
      setBooks((prev) =>
        prev.map((b) => (b.id === book.id ? updatedBook : b))
      );
    } catch (err) {
      console.error("Failed to toggle borrow status:", err);
      alert("Failed to update book status");
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Books</h1>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by title..."
          className="input input-bordered w-full md:w-1/2"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
        />
        <select
          className="select select-bordered w-full md:w-1/4"
          value={selectedAuthor}
          onChange={(e) => {
            setSelectedAuthor(e.target.value);
            setPage(1);
          }}
        >
          {authors.map((author) => (
            <option key={author} value={author}>
              {author}
            </option>
          ))}
        </select>
      </div>

      {filteredBooks.length === 0 && (
        <p className="text-gray-500">No books found.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {paginatedBooks.map((book) => (
          <BookCard
            key={book.id}
            book={book}
            onDelete={onDelete}
            onEdit={openEdit}
            onToggleBorrow={handleToggleBorrow}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6 flex-wrap">
          <button
            className="btn btn-sm"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              className={`btn btn-sm ${num === page ? "btn-primary" : "btn-outline"}`}
              onClick={() => setPage(num)}
            >
              {num}
            </button>
          ))}

          <button
            className="btn btn-sm"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      )}

      {/* Edit Modal */}
      <dialog id="edit_modal" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Edit Book</h3>
          <div className="space-y-4 mt-4">
            <input
              className="input input-bordered w-full"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <input
              className="input input-bordered w-full"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
            />
          </div>
          <div className="modal-action">
            <button className="btn btn-primary" onClick={handleUpdate}>
              Save
            </button>
            <button
              className="btn"
              onClick={() =>
                document.getElementById("edit_modal").close()
              }
            >
              Cancel
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
