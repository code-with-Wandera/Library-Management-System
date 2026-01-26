export default function BookCard({ book, onDelete, onEdit, onToggleBorrow }) {
  if (!book) return null; // prevents errors if book is undefined

  const handleDelete = () => onDelete?.(book.id);
  const handleEdit = () => onEdit?.(book);
  const handleToggle = () => onToggleBorrow?.(book);

  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body">
        <div className="flex items-center gap-2">
          <h2 className="card-title">{book.title || "Untitled"}</h2>
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-full text-white
                        transition-all duration-300 ease-in-out
                        transform hover:scale-110 hover:shadow-lg
                        ${book.isBorrowed ? "bg-red-500" : "bg-green-500"}`}
          >
            {book.isBorrowed ? "Borrowed" : "Available"}
          </span>
        </div>

        <p>Author: {book.author || "Unknown"}</p>

        <div className="flex gap-2 mt-4">
          <button className="btn btn-sm btn-warning" onClick={handleEdit}>
            Edit
          </button>

          <button className="btn btn-sm btn-error" onClick={handleDelete}>
            Delete
          </button>

          <button
            className={`btn btn-sm ${
              book.isBorrowed ? "btn-success" : "btn-info"
            }`}
            onClick={handleToggle}
          >
            {book.isBorrowed ? "Return Book" : "Borrow Book"}
          </button>
        </div>
      </div>
    </div>
  );
}
