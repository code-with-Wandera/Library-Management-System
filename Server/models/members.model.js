import mongoose from "mongoose";

const memberSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      index: true, // Optimized for your regex search
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      index: true, // Optimized for your regex search
    },
    email: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      sparse: true, // Allows multiple members to have no email while keeping uniqueness for those who do
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please fill a valid email address"],
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class", // Ensure this matches your Class model name
      default: null,
      index: true, // Optimized for the "unassigned" filter
    },
    totalFines: {
      type: Number,
      default: 0,
      min: [0, "Fines cannot be negative"],
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
  },
  {
    timestamps: true, // Handles the createdAt field used in your sorting and growth analytics
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * INDEXES FOR PERFORMANCE
 * 1. Compound index for the common "Search by Name" query
 * 2. Sorting by createdAt (used in getMembers and Analytics)
 */
memberSchema.index({ firstName: "text", lastName: "text" });
memberSchema.index({ createdAt: -1 });

/**
 * VIRTUALS
 * Helpful for frontend display without storing extra data
 */
memberSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

const Member = mongoose.model("Member", memberSchema);

export default Member;