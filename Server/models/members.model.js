import mongoose from "mongoose";

const memberSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: /^\S+@\S+\.\S+$/, // simple email validation
    },
    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  { timestamps: true }
);

// Prevent duplicate names (case-insensitive)
memberSchema.index(
  { firstName: 1, lastName: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } }
);

// Optional: compound unique index for email (ensures email is unique globally)
memberSchema.index({ email: 1 }, { unique: true });

export default mongoose.model("Member", memberSchema);
