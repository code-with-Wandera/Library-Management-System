// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import API from "./api/api";

import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Books from "./pages/Books";
import AddBook from "./pages/AddBook";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthContext } from "./context/AuthContext"; // import context

function App() {
  const { user } = useContext(AuthContext); // get user from context
  const [books, setBooks] = useState([]);

  // Fetch books from API on mount
  useEffect(() => {
    if (user) fetchBooks(); // only fetch if logged in
  }, [user]);

  async function fetchBooks() {
    try {
      const res = await API.get("/books");
      setBooks(res.data);
    } catch (err) {
      console.error("Failed to fetch books:", err);
    }
  }

  async function deleteBook(id) {
    try {
      await API.delete(`/books/${id}`);
      setBooks((prevBooks) => prevBooks.filter((book) => book.id !== id));
    } catch (err) {
      console.error("Failed to delete book:", err);
    }
  }

  async function editBook(updatedBook) {
    try {
      await API.put(`/books/${updatedBook.id}`, updatedBook);
      setBooks((prevBooks) =>
        prevBooks.map((book) => (book.id === updatedBook.id ? updatedBook : book))
      );
    } catch (err) {
      console.error("Failed to edit book:", err);
    }
  }

  return (
    <BrowserRouter>
      <Navbar />
      <div className="flex">
        {/* Sidebar only renders if user is logged in */}
        {user && <Sidebar />}

        <main className="p-6 w-full bg-gray-100 min-h-screen">
          <Routes>
            {/* Public route: Login */}
            <Route path="/login" element={<Login />} />

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
