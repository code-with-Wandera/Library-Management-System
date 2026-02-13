import React from "react";

export default function BookCard({ book, onEdit, onDelete, onAction }) {
  // Defensive check: If book prop is missing, don't crash
  if (!book) return null;

  const isIssued = book.status === "issued";

  // Helper to format the borrower name safely
  const borrowerName = book.borrowedBy 
    ? `${book.borrowedBy.firstName || ""} ${book.borrowedBy.lastName || ""}`.trim() 
    : "Unknown Member";

  // Safe date formatting to prevent "Invalid Date" UI
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? "Invalid Date" : date.toLocaleDateString();
  };

  return (
    <div className="card bg-base-100 shadow-sm border border-base-300 transition-all hover:shadow-lg hover:-translate-y-1">
      <div className="card-body p-5">
        <div className="flex justify-between items-start gap-4">
          <h2 className="card-title text-lg font-bold text-primary leading-tight">
            {book.title || "Untitled"}
          </h2>
          <div className="badge badge-secondary badge-sm badge-outline whitespace-nowrap px-3 py-3 font-bold">
            {book.academicLevel || "General"}
          </div>
        </div>
        
        <p className="text-sm opacity-60 font-medium">
          {book.author || "Unknown Author"} 
          <span className="mx-1 opacity-30">•</span> 
          <span className="text-primary/80">{book.genre || "General"}</span>
        </p>

        <div className="mt-6 flex flex-col gap-2">
          {isIssued ? (
            <div className="bg-error/5 p-3 rounded-xl border border-error/10">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-error animate-pulse"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-error">Currently Issued</span>
              </div>
              <p className="text-[11px] font-semibold opacity-70">
                Member: <span className="text-base-content">{borrowerName}</span>
              </p>
              {book.dueDate && (
                <p className="text-[11px] font-bold text-error">
                  Due: {formatDate(book.dueDate)}
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-success">Available</span>
            </div>
          )}
        </div>

        <div className="card-actions justify-between items-center mt-6 pt-4 border-t border-base-200">
          <div className="flex gap-1">
            <button 
              className="btn btn-ghost btn-xs hover:bg-base-200" 
              onClick={() => onEdit(book)}
              aria-label="Edit book"
            >
              Edit
            </button>
            <button 
              className="btn btn-ghost btn-xs text-error hover:bg-error/10" 
              onClick={() => onDelete(book._id)}
              aria-label="Delete book"
            >
              Delete
            </button>
          </div>
          
          <button 
            className={`btn btn-sm px-5 rounded-lg font-bold shadow-sm transition-transform active:scale-95 ${
              isIssued ? "btn-warning text-warning-content" : "btn-primary"
            }`}
            onClick={() => onAction(book)}
          >
            {isIssued ? "Return" : "Issue"}
          </button>
        </div>
      </div>
    </div>
  );
}