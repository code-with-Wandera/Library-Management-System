import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../src/api/api";

import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Books from "./pages/Books";
import AddBook from "./pages/AddBook";
import ProtectedRoute from "./components/ProtectedRoute"; // import ProtectedRoute

function App() {
  const [books, setBooks] = useState([]);
  const [user, setUser] = useState(null); // example user state

  // Fetch books from API on mount
  useEffect(() => {
    fetchBooks();
  }, []);

  async function fetchBooks() {
    try {
      const res = await API.get("/books");
      setBooks(res.data);
    } catch (err) {
      console.error("Failed to fetch books:", err);
    }
  }

  // Delete a book via API and update state locally
  async function deleteBook(id) {
    try {
      await API.delete(`/books/${id}`);
      setBooks((prevBooks) => prevBooks.filter((book) => book.id !== id));
    } catch (err) {
      console.error("Failed to delete book:", err);
    }
  }

  // Edit a book via API and update state locally
  async function editBook(updatedBook) {
    try {
      await API.put(`/books/${updatedBook.id}`, updatedBook);
      setBooks((prevBooks) =>
        prevBooks.map((book) =>
          book.id === updatedBook.id ? updatedBook : book
        )
      );
    } catch (err) {
      console.error("Failed to edit book:", err);
    }
  }

  return (
    <BrowserRouter>
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="p-6 w-full bg-gray-100 min-h-screen">
          <Routes>
            {/* Protected Dashboard */}
            <Route
              path="/"
              element={
                <ProtectedRoute user={user}>
                  <Dashboard books={books} />
                </ProtectedRoute>
              }
            />

            {/* Protected Books page */}
            <Route
              path="/books"
              element={
                <ProtectedRoute user={user}>
                  <Books
                    books={books}
                    setBooks={setBooks}
                    onDelete={deleteBook}
                    onEdit={editBook}
                  />
                </ProtectedRoute>
              }
            />

            {/* Protected AddBook page */}
            <Route
              path="/add-book"
              element={
                <ProtectedRoute user={user}>
                  <AddBook books={books} setBooks={setBooks} />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
