export default function Navbar({ toggleSidebar }) {
  return (
    <header className="flex items-center justify-between bg-white px-4 py-3 shadow">
      <button
        onClick={toggleSidebar}
        className="text-gray-700 md:hidden focus:outline-none"
      >
        ☰
      </button>
      <h1 className="text-xl font-bold">Library Management System</h1>
    </header>
  );
}
