import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["fine_accrued", "payment_received"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
    }, // Optional: only for fine_accrued
    description: String,
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Transaction", transactionSchema);
