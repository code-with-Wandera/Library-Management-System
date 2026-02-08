import mongoose from "mongoose";

const classSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: [true, "Class name is required"], 
      unique: true, 
      trim: true,
      index: true 
    },
    // --- LINK TO ACADEMIC SYSTEM ---
    academicLevel: {
      type: String,
      enum: ["Primary", "Secondary", "College", "University"],
      required: [true, "Academic level is required"],
      index: true
    },
    description: {
      type: String,
      trim: true
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

/**
 * REVERSE POPULATION
 * Automatically find all members assigned to this class
 */
classSchema.virtual("members", {
  ref: "Member",
  localField: "_id",
  foreignField: "classId",
});

export default mongoose.model("Class", classSchema);