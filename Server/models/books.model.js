import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
  {
    title: { 
      type: String, 
      required: [true, "Book title is required"], 
      trim: true,
      index: true // Faster searching by title
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
    
    // --- CATEGORIZATION ---
    genre: { 
      type: String, 
      required: true, 
      lowercase: true,
      default: "general" 
    },
    academicLevel: {
      type: String,
      enum: ["Primary", "Secondary", "College", "University", "Non-academic"],
      default: "Non-academic",
      index: true
    },

    // --- STATUS & TRACKING ---
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
    },

    // --- DATES & FINES ---
    issueDate: { type: Date },
    dueDate: { type: Date },
    returnDate: { type: Date },
    fineAmount: { type: Number, default: 0 },
    
    // Legacy support (maintained but controlled via hooks)
    isBorrowed: { type: Boolean, default: false },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true }, 
    toObject: { virtuals: true } 
  }
);

/**
 * PRODUCTION INDEXING
 * Compound index for common library queries: searching for available books in a specific level
 */
bookSchema.index({ status: 1, academicLevel: 1 });

// --- FIXED PRE-SAVE HOOK ---
// Automatically syncs isBorrowed and Status based on borrowedBy presence
bookSchema.pre("save", function (next) {
  if (this.isModified("borrowedBy")) {
    this.isBorrowed = !!this.borrowedBy;
    
    // Auto-set status if not manually overridden
    if (this.borrowedBy) {
      this.status = "issued";
    } else {
      this.status = "available";
      this.issueDate = null;
      this.dueDate = null;
    }
  }
  next();
});

// --- FIXED PRE-FINDONEANDUPDATE HOOK ---
bookSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  
  // Handle standard update object { borrowedBy: ... }
  if (update.borrowedBy !== undefined) {
    update.isBorrowed = !!update.borrowedBy;
    update.status = update.borrowedBy ? "issued" : "available";
  }
  
  // Handle $set operations if used
  if (update.$set && update.$set.borrowedBy !== undefined) {
    update.$set.isBorrowed = !!update.$set.borrowedBy;
    update.$set.status = update.$set.borrowedBy ? "issued" : "available";
  }

  next();
});

export default mongoose.model("Book", bookSchema);