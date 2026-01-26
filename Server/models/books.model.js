import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    author: { type: String, required: true },
    isbn: { type: String, unique: true, sparse: true }, // optional unique ISBN
    isBorrowed: { type: Boolean, default: false },
    borrowedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      default: null,
    },
  },
  { timestamps: true }
);

// --- FIXED PRE-SAVE HOOK ---
bookSchema.pre("save", function () {
  // regular function, not async, not arrow
  this.isBorrowed = this.borrowedBy ? true : false;
});

// --- FIXED PRE-FINDONEANDUPDATE HOOK ---
bookSchema.pre("findOneAndUpdate", function () {
  // regular function, not async, not arrow
  const update = this.getUpdate();
  if (update.borrowedBy !== undefined) {
    update.isBorrowed = update.borrowedBy ? true : false;
    this.setUpdate(update);
  }
});

export default mongoose.model("Book", bookSchema);
