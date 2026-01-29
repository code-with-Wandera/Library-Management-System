import mongoose from "mongoose";

const memberSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true, // unique index at schema level
    },
    role: {
      type: String,
      enum: ["user", "librarian", "admin"],
      default: "user",
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  },
);

// Compound index for firstName + lastName uniqueness (optional)
memberSchema.index(
  { firstName: 1, lastName: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } },
);

// Index for faster sorting/filtering by createdAt
memberSchema.index({ createdAt: -1 });

const Member = mongoose.model("Member", memberSchema);

export default Member;
