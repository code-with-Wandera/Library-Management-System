// models/members.model.js
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
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true, // Allows optional unique email
    },
  },
  { timestamps: true }
);

const Member = mongoose.model("Member", memberSchema);

export default Member;
