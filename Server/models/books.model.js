import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
  {
    title: { 
      type: String, 
      required: [true, "Book title is required"], 
      trim: true,
      index: true 
    },
    author: { 
      type: String, 
      required: [true, "Author name is required"], 
      trim: true 
    },
    isbn: { 
      type: String, 
      unique: true, 
      sparse: true, 
      trim: true 
    },
    genre: { 
      type: String, 
      required: true, 
      lowercase: true,
      trim: true,
      index: true, // IMPORTANT: Your folder view relies on this
      default: "general" 
    },
    academicLevel: {
      type: String,
      enum: ["Primary", "Secondary", "College", "University", "Non-academic"],
      default: "Non-academic",
      index: true
    },
    status: {
      type: String,
      enum: ["available", "issued", "overdue", "maintenance"],
      default: "available",
      index: true
    },
    borrowedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      default: null,
      index: true // Faster lookups for "Which books does this member have?"
    },
    dueDate: { type: Date },
    fineAmount: { type: Number, default: 0 },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true }, 
    toObject: { virtuals: true } 
  }
);

/**
 * PRODUCTION INDEXING
 * Optimized for the "Folder View": Filters by level AND genre
 */
bookSchema.index({ academicLevel: 1, genre: 1 });

/**
 * Text Index for Search Bar
 * Allows global search across Title and Author simultaneously
 */
bookSchema.index({ title: "text", author: "text" });

// --- VIRTUALS ---
// Instead of storing isBorrowed (which can get out of sync), use a Virtual
bookSchema.virtual("isBorrowed").get(function() {
  return !!this.borrowedBy;
});

export default mongoose.model("Book", bookSchema);