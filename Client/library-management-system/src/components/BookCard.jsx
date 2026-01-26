// src/components/BookCard.jsx
import React from "react";

export default function BookCard({ book, onEdit, onDelete, onToggleBorrow }) {
  return (
    <div className="card bg-white shadow-md p-4 flex flex-col justify-between">
      <div>
        <h2 className="text-xl font-bold mb-2">{book.title}</h2>
        <p className="text-gray-600 mb-1">Author: {book.author}</p>
        {book.isBorrowed && book.borrowedBy ? (
          <p className="text-red-500 font-medium">
            Borrowed by: {book.borrowedBy.name || "Unknown"}
          </p>
        ) : (
          <p className="text-green-500 font-medium">Available</p>
        )}
      </div>

      <div className="mt-4 flex justify-between items-center">
        <div className="flex gap-2">
          <button
            className="btn btn-sm btn-primary"
            onClick={() => onEdit(book)}
          >
            Edit
          </button>
          <button
            className="btn btn-sm btn-error"
            onClick={() => onDelete(book._id)}
          >
            Delete
          </button>
        </div>

        <button
          className={`btn btn-sm ${
            book.isBorrowed ? "btn-warning" : "btn-success"
          }`}
          onClick={() => onToggleBorrow(book)}
        >
          {book.isBorrowed ? "Return" : "Borrow"}
        </button>
      </div>
    </div>
  );
}
