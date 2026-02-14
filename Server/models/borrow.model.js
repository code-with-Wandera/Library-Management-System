import mongoose from "mongoose";

const borrowSchema = new mongoose.Schema({
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: "Member", required: true },
  borrowDate: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },
  returnDate: { type: Date },
  status: { 
    type: String, 
    enum: ["borrowed", "returned", "overdue"], 
    default: "borrowed" 
  }
}, { timestamps: true });

export default mongoose.model("Borrow", borrowSchema);