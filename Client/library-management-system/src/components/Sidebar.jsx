// src/components/Sidebar.jsx
import { Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Sidebar() {
  const { user, logout } = useContext(AuthContext);

  if (!user) return null;

  return (
    <aside className="w-64 min-h-screen bg-gray-900 text-white p-4">
      <h2 className="text-xl font-bold mb-6">Library System</h2>

      <nav className="space-y-2">
        <Link className="block px-3 py-2 rounded hover:bg-gray-700" to="/">
          Dashboard
        </Link>
        <Link className="block px-3 py-2 rounded hover:bg-gray-700" to="/books">
          Books
        </Link>
        <Link className="block px-3 py-2 rounded hover:bg-gray-700" to="/add-book">
          Add Book
        </Link>
        <Link className="block px-3 py-2 rounded hover:bg-gray-700" to="/members">
          Members
        </Link>

         <Link className="block px-3 py-2 rounded hover:bg-gray-700" to="/classes">
          Classes
        </Link>

        <button
          onClick={logout}
          className="mt-6 w-full text-left px-3 py-2 rounded bg-red-600 hover:bg-red-700"
        >
          Logout
        </button>
      </nav>
    </aside>
  );
}
