import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

export default function AddBook({ books, setBooks }) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");

  const navigate = useNavigate();

  async function handleAdd(e) {
    e.preventDefault();
    if (!title || !author) return alert("All fields required");

    try {
      await API.post("/books", { title, author, isBorrowed: false });
      const res = await API.get("/books");
      setBooks(res.data);
      setTitle("");
      setAuthor("");
      navigate("/books");
    } catch (err) {
      console.error("Failed to add book:", err);
      alert("Failed to add book");
    }
  }

  return (
    <div className="max-w-md mx-auto mt-8">
      <h2 className="text-xl font-bold mb-4">Add Book</h2>
      <form onSubmit={handleAdd}>
        <input
          className="input input-bordered w-full mb-4"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className="input input-bordered w-full mb-4"
          placeholder="Author"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
        />
        <button type="submit" className="btn btn-primary">
          Add Book
        </button>
      </form>
    </div>
  );
}
