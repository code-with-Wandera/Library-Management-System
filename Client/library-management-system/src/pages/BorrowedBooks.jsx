import { useEffect, useState } from "react";
import API from "../api/api";
import Pagination from "../components/Pagination.jsx";
import SearchInput from "../components/SearchInput.jsx";

export default function BorrowedBooks() {
  const [borrows, setBorrows] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => { API.get("/borrowed").then(res=>setBorrows(res.data)).catch(console.error); }, []);

  const filtered = borrows.filter(b =>
    b.member.toLowerCase().includes(search.toLowerCase()) ||
    b.book.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const displayed = filtered.slice((currentPage-1)*itemsPerPage,currentPage*itemsPerPage);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Borrowed Books</h1>
      <SearchInput value={search} setValue={setSearch} placeholder="Search by member or book..." />

      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead><tr><th>#</th><th>Member</th><th>Book</th><th>Borrowed At</th></tr></thead>
          <tbody>
            {displayed.length>0 ? displayed.map((b,i)=><tr key={i}><td>{(currentPage-1)*itemsPerPage+i+1}</td><td>{b.member}</td><td>{b.book}</td><td>{new Date(b.borrowedAt).toLocaleDateString()}</td></tr>) : <tr><td colSpan="4" className="text-center">No data</td></tr>}
          </tbody>
        </table>
      </div>

      <Pagination totalPages={totalPages} currentPage={currentPage} setCurrentPage={setCurrentPage} />
    </div>
  );
}
