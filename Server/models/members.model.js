import mongoose from "mongoose";

const memberSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      index: true, // Speeds up searching by name
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      index: true,
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
    // --- LIBRARY SPECIFIC FIELDS ---
    status: {
      type: String,
      enum: ["active", "suspended", "inactive"],
      default: "active",
    },
    totalFines: {
      type: Number,
      default: 0, // Accrued fines across all books
    },
    // --- ACADEMIC LINK ---
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
 * VIRTUALS
 * Helpful for UI to display "John Doe" without concatenating manually
 */
memberSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

/**
 * REVERSE POPULATION (Optional but 🔥)
 * Allows you to see what books a member has issued without storing an array in Member
 */
memberSchema.virtual("activeLoans", {
  ref: "Book",
  localField: "_id",
  foreignField: "borrowedBy",
});

const Member = mongoose.model("Member", memberSchema);

export default Member;