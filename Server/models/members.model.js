import mongoose from "mongoose";

const memberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true },
    phone: String,
  },
  { timestamps: true }
);

export default mongoose.model("Member", memberSchema);
