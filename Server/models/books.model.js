import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    author: { type: String, required: true },
    isBorrowed: { type: Boolean, default: false },
    borrowedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      default: null,
    },
  },
  { timestamps: true }
);

// Pre-save hook to sync isBorrowed with borrowedBy
bookSchema.pre("save", function (next) {
  this.isBorrowed = this.borrowedBy ? true : false;
  next();
});

// Optional: also update on findOneAndUpdate operations
bookSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if (update.borrowedBy !== undefined) {
    update.isBorrowed = update.borrowedBy ? true : false;
    this.setUpdate(update);
  }
  next();
});

export default mongoose.model("Book", bookSchema);
