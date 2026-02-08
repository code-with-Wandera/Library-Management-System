import React from "react";

export default function BookCard({ book, onEdit, onDelete, onAction }) {
  const isIssued = book.status === "issued";

  // Helper to format the borrower name safely
  const borrowerName = book.borrowedBy 
    ? `${book.borrowedBy.firstName || ""} ${book.borrowedBy.lastName || ""}`.trim() 
    : "Unknown Member";

  return (
    <div className="card bg-base-100 shadow-xl border border-base-200 transition-all hover:shadow-2xl">
      <div className="card-body">
        <div className="flex justify-between items-start gap-2">
          <h2 className="card-title text-primary leading-tight">{book.title}</h2>
          <div className="badge badge-secondary badge-outline whitespace-nowrap">
            {book.academicLevel || "General"}
          </div>
        </div>
        
        <p className="text-sm opacity-70 italic">by {book.author} | {book.genre}</p>

        <div className="mt-4">
          {isIssued ? (
            <div className="space-y-1">
              <span className="badge badge-error gap-2 font-semibold">Issued</span>
              <p className="text-xs font-medium text-base-content opacity-80">
                Borrowed by: <span className="text-primary">{borrowerName}</span>
              </p>
              {book.dueDate && (
                <p className="text-xs font-bold text-error">
                  Due: {new Date(book.dueDate).toLocaleDateString()}
                </p>
              )}
            </div>
          ) : (
            <span className="badge badge-success gap-2 font-semibold">Available</span>
          )}
        </div>

        <div className="card-actions justify-between items-center mt-6 pt-4 border-t border-base-200">
          <div className="flex gap-1">
            <button 
              className="btn btn-ghost btn-xs" 
              onClick={() => onEdit(book)}
              title="Edit Details"
            >
              Edit
            </button>
            <button 
              className="btn btn-ghost btn-xs text-error" 
              onClick={() => onDelete(book._id)}
              title="Delete Book"
            >
              Delete
            </button>
          </div>
          
          <button 
            className={`btn btn-sm shadow-md ${isIssued ? "btn-warning" : "btn-primary"}`}
            onClick={() => onAction(book)}
          >
            {isIssued ? "Return Book" : "Issue Book"}
          </button>
        </div>
      </div>
    </div>
  );
}