
import Book from "../models/books.model.js";

export const borrowBook = async (req, res) => {
  const { memberId } = req.body;

  const book = await Book.findById(req.params.id);
  book.isBorrowed = true;
  book.borrowedBy = memberId;

  await book.save();
  res.json(book);
};

export const returnBook = async (req, res) => {
  const book = await Book.findById(req.params.id);
  book.isBorrowed = false;
  book.borrowedBy = null;

  await book.save();
  res.json(book);
};
