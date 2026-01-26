import Book from "../models/books.model.js";

// Helper to add `id` field
const formatBook = (book) => {
  const b = book.toObject();
  b.id = b._id.toString();
  return b;
};

// GET all books
export const getBooks = async (req, res) => {
  try {
    const books = await Book.find();
    res.json(books.map(formatBook));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch books" });
  }
};

// ADD a new book
export const addBook = async (req, res) => {
  try {
    const book = new Book(req.body);
    const saved = await book.save();
    res.status(201).json(formatBook(saved));
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Failed to add book" });
  }
};

// UPDATE a book
export const updateBook = async (req, res) => {
  try {
    const { borrowedBy, ...rest } = req.body;

    // Fetch current book
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    // Update fields from frontend
    for (let key in rest) {
      book[key] = rest[key];
    }

    // Sync borrowed status automatically
    if (borrowedBy !== undefined) {
      book.borrowedBy = borrowedBy || null;
      book.isBorrowed = !!borrowedBy;
    }

    const updated = await book.save();
    res.json(formatBook(updated));
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Failed to update book" });
  }
};

// DELETE a book
export const deleteBook = async (req, res) => {
  try {
    const deleted = await Book.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Book not found" });
    res.json({ message: "Book deleted" });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Failed to delete book" });
  }
};
