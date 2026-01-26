// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import API from "./api/api";

import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar.jsx";
import Dashboard from "./pages/Dashboard";
import Books from "./pages/Books";
import Login from "./pages/Login";
import Members from "./pages/members.jsx";
import Profile from "./pages/Profile.jsx";
import BorrowedBooks from "./pages/BorrowedBooks.jsx";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthContext } from "./context/AuthContext";
import Classes from "./pages/Classes.jsx";


export default function App() {
  const { user } = useContext(AuthContext);
  const [books, setBooks] = useState([]);

  // Fetch books only if user is logged in
  useEffect(() => {
    if (user) fetchBooks();
  }, [user]);

  // Fetch all books
  async function fetchBooks() {
    try {
      const res = await API.get("/books");
      setBooks(res.data);
    } catch (err) {
      console.error("Failed to fetch books:", err);
    }
  }

  // Delete book
  async function deleteBook(id) {
    try {
      await API.delete(`/books/${id}`);
      setBooks((prev) => prev.filter((book) => book.id !== id));
    } catch (err) {
      console.error("Failed to delete book:", err);
    }
  }

  // Edit book
  async function editBook(updatedBook) {
    try {
      await API.put(`/books/${updatedBook.id}`, updatedBook);
      setBooks((prev) =>
        prev.map((book) => (book.id === updatedBook.id ? updatedBook : book))
      );
    } catch (err) {
      console.error("Failed to edit book:", err);
    }
  }

  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        {/* Navbar always on top */}
        <Navbar />

        <div className="flex flex-1 bg-gray-100">
          {/* Sidebar only if logged in */}
          {user && <Sidebar className="w-64" />}

          {/* Main content */}
          <main className="flex-1 p-6">
            <Routes>
              {/* Public Login route */}
              <Route path="/login" element={<Login />} />

              {/* Dashboard */}
              <Route
                path="/"
                element={
                  <ProtectedRoute user={user}>
                    <Dashboard books={books} />
                  </ProtectedRoute>
                }
              />

              {/* Books pages */}
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
              {/* Members pages */}
              <Route
                path="/members"
                element={
                  <ProtectedRoute user={user}>
                    <Members />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/members/:id"
                element={
                  <ProtectedRoute user={user}>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              {/* Borrowed Books */}
              <Route
                path="/borrowed"
                element={
                  <ProtectedRoute user={user}>
                    <BorrowedBooks />
                  </ProtectedRoute>
                }
              />
                <Route
                path="/classes"
                element={
                  <ProtectedRoute user={user}>
                    <Classes />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
