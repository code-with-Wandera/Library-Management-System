import mongoose from "mongoose";

const memberSchema = new mongoose.Schema(
  {
    // Unique ID for barcodes/scanners
    memberId: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      index: true,
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true, 
      match: [/\S+@\S+\.\S+/, "Please use a valid email address"],
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "suspended", "inactive"],
      default: "active",
      index: true, // Crucial for filtering active members in admin dash
    },
    totalFines: {
      type: Number,
      default: 0,
      min: [0, "Fines cannot be negative"], // Guardrail against logic errors
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      default: null,
      index: true,
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

/**
 * PRODUCTION INDEXING
 * Compound index for "Search by Name" - handles (Last, First) or (First Last) searches
 */
memberSchema.index({ firstName: 1, lastName: 1 });

/**
 * VIRTUALS
 */
memberSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

/**
 * REVERSE POPULATION
 * Usage: await Member.find().populate('activeLoans')
 */
memberSchema.virtual("activeLoans", {
  ref: "Book",
  localField: "_id",
  foreignField: "borrowedBy",
});

const Member = mongoose.model("Member", memberSchema);
export default Member;