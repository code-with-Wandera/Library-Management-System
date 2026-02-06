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

    //This field allows us to link a member to a class, but its optional befause not all members may belong to a class.
    classId:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      default: null,
    }
  },
  { timestamps: true }
);

const Member = mongoose.model("Member", memberSchema);

export default Member;
