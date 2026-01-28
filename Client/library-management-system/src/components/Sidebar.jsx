import { NavLink } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Sidebar() {
  const { user, logout } = useContext(AuthContext);

  if (!user) return null;

  const baseClass =
    "block px-3 py-2 rounded hover:bg-gray-700 transition-colors";
  const activeClass = "bg-gray-700 font-bold";

  return (
    <aside className="w-64 min-h-screen bg-gray-900 text-white p-4 flex flex-col">
      <h2 className="text-xl font-bold mb-6">Library System</h2>

      <nav className="flex-1 space-y-2">
        <NavLink
          to="/"
          className={({ isActive }) => `${baseClass} ${isActive ? activeClass : ""}`}
        >
          Dashboard
        </NavLink>

        <NavLink
          to="/books"
          className={({ isActive }) => `${baseClass} ${isActive ? activeClass : ""}`}
        >
          Books
        </NavLink>

        <NavLink
          to="/members"
          className={({ isActive }) => `${baseClass} ${isActive ? activeClass : ""}`}
        >
          Members
        </NavLink>

        <NavLink
          to="/members/analytics/growth"
          className={({ isActive }) => `${baseClass} ${isActive ? activeClass : ""}`}
        >
          Member Analytics
        </NavLink>

        <NavLink
          to="/classes"
          className={({ isActive }) => `${baseClass} ${isActive ? activeClass : ""}`}
        >
          Classes
        </NavLink>
      </nav>

      <button
        onClick={logout}
        className="mt-6 w-full text-left px-3 py-2 rounded bg-red-600 hover:bg-red-700 transition-colors"
      >
        Logout
      </button>
    </aside>
  );
}
