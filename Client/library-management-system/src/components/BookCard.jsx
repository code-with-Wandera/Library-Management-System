import React from "react";

export default function BookCard({ book, onEdit, onDelete, onAction }) {
  const isIssued = book.status === "issued";

  return (
    <div className="card bg-base-100 shadow-xl border border-base-200">
      <div className="card-body">
        <div className="flex justify-between items-start">
          <h2 className="card-title text-primary">{book.title}</h2>
          <div className="badge badge-secondary badge-outline">{book.academicLevel}</div>
        </div>
        
        <p className="text-sm opacity-70">by {book.author} | {book.genre}</p>

        <div className="mt-4">
          {isIssued ? (
            <div className="text-xs">
              <span className="badge badge-error gap-2">Issued</span>
              <p className="mt-1 text-error">Due: {new Date(book.dueDate).toLocaleDateString()}</p>
            </div>
          ) : (
            <span className="badge badge-success gap-2">Available</span>
          )}
        </div>

        <div className="card-actions justify-between mt-6">
          <div className="flex gap-1">
            <button className="btn btn-ghost btn-xs" onClick={() => onEdit(book)}>Edit</button>
            <button className="btn btn-ghost btn-xs text-error" onClick={() => onDelete(book._id)}>Delete</button>
          </div>
          
          <button 
            className={`btn btn-sm ${isIssued ? "btn-warning" : "btn-primary"}`}
            onClick={() => onAction(book)}
          >
            {isIssued ? "Return Book" : "Issue Book"}
          </button>
        </div>
      </div>
    </div>
  );
}