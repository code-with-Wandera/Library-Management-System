// src/components/Sidebar.jsx
import { Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Sidebar() {
  const { user, logout } = useContext(AuthContext); // get user and logout function

  if (!user) {
    // If not logged in, hide sidebar
    return null;
  }

  return (
    <div className="w-64 bg-base-200 min-h-screen p-4">
      <ul className="menu">
        <li>
          <Link to="/">Dashboard</Link>
        </li>
        <li>
          <Link to="/books">Books</Link>
        </li>
        <li>
          <Link to="/add-book">Add Book</Link>
        </li>
        <li>
          <button
            onClick={logout}
            className="w-full text-left mt-4 text-red-500 hover:text-red-700"
          >
            Logout
          </button>
        </li>
      </ul>
    </div>
  );
}
