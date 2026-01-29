import mongoose from "mongoose";

const memberSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,          //keep this
      trim: true,
      lowercase: true,
      match: /^\S+@\S+\.\S+$/,
    },
    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  { timestamps: true }
);

// Prevent duplicate full names (case-insensitive)
memberSchema.index(
  { firstName: 1, lastName: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } }
);

// REMOVE THIS — it duplicates the field-level index
// memberSchema.index({ email: 1 }, { unique: true });

export default mongoose.model("Member", memberSchema);