import mongoose from "mongoose";

const memberSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^\S+@\S+\.\S+$/, // simple email validation
    },
    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  { timestamps: true }
);

// Indexes for faster queries
memberSchema.index({ firstName: 1, lastName: 1 }, { unique: true, collation: { locale: "en", strength: 2 } });
memberSchema.index({ email: 1 }, { unique: true });
memberSchema.index({ createdAt: 1 });

export default mongoose.model("Member", memberSchema);
