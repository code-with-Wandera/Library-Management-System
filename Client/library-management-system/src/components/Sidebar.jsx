
import { Link } from "react-router-dom";

export default function Sidebar() {
  return (
    <div className="w-64 bg-base-200 min-h-screen p-4">
      <ul className="menu">
        <li><Link to="/">Dashboard</Link></li>
        <li><Link to="/books">Books</Link></li>
        <li><Link to="/add-book">Add Book</Link></li>
      </ul>
    </div>
  );
}
