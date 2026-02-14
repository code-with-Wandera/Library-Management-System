import { NavLink } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
// Optional: Adding icons makes the tenant dashboard look much more high-end
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  School, 
  BarChart3, 
  ClipboardList, 
  LogOut 
} from "lucide-react";

export default function Sidebar() {
  const { user, logout } = useContext(AuthContext);

  if (!user) return null;

  const baseClass =
    "flex items-center space-x-3 px-3 py-2 rounded hover:bg-gray-700 transition-colors";
  const activeClass = "bg-gray-700 font-bold border-l-4 border-blue-500";

  return (
    <aside className="w-64 min-h-screen bg-gray-900 text-white p-4 flex flex-col shadow-xl">
      <div className="flex items-center space-x-2 mb-8 px-2">
        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold">L</div>
        <h2 className="text-xl font-bold tracking-tight">Library Admin</h2>
      </div>

      <nav className="flex-1 space-y-2">
        <NavLink
          to="/"
          className={({ isActive }) => `${baseClass} ${isActive ? activeClass : ""}`}
        >
          <LayoutDashboard size={18} />
          <span>Overview</span>
        </NavLink>

        <NavLink
          to="/books"
          className={({ isActive }) => `${baseClass} ${isActive ? activeClass : ""}`}
        >
          <BookOpen size={18} />
          <span>Books</span>
        </NavLink>

        <NavLink
          to="/members"
          className={({ isActive }) => `${baseClass} ${isActive ? activeClass : ""}`}
        >
          <Users size={18} />
          <span>Members</span>
        </NavLink>
        
        <NavLink
          to="/classes"
          className={({ isActive }) => `${baseClass} ${isActive ? activeClass : ""}`}
        >
          <School size={18} />
          <span>Classes</span>
        </NavLink>

        {/* --- NEW TENANT REPORTING ROUTES --- */}
        <div className="pt-4 pb-1">
          <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Insights
          </p>
        </div>

        <NavLink
          to="/reports"
          className={({ isActive }) => `${baseClass} ${isActive ? activeClass : ""}`}
        >
          <BarChart3 size={18} />
          <span>Reports</span>
        </NavLink>

        <NavLink
          to="/audit-logs"
          className={({ isActive }) => `${baseClass} ${isActive ? activeClass : ""}`}
        >
          <ClipboardList size={18} />
          <span>System Logs</span>
        </NavLink>
      </nav>

      <button
        onClick={logout}
        className="mt-auto flex items-center space-x-3 w-full text-left px-3 py-2 rounded bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white transition-all border border-red-600/20"
      >
        <LogOut size={18} />
        <span>Logout</span>
      </button>
    </aside>
  );
}