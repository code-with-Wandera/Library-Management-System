import mongoose from "mongoose";

const memberSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

// Prevent duplicates (case-insensitive)
memberSchema.index(
  {
    firstName: 1,
    lastName: 1,
  },
  { unique: true, collation: { locale: "en", strength: 2 } }
);

export default mongoose.model("Member", memberSchema);
