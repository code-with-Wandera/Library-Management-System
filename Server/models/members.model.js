import mongoose from "mongoose";

const memberSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    className: { type: String, default: "Unassigned" }
  },
  { timestamps: true }
);

export default mongoose.model("Member", memberSchema);
