
import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import API from "../api/api";

export default function Login() {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin(e) {
    e.preventDefault();

    const res = await API.post("/auth/login", {
      email,
      password,
    });

    login(res.data);
  }

  return (
    <form onSubmit={handleLogin} className="card p-6 max-w-sm mx-auto">
      <input className="input" placeholder="Email" onChange={e=>setEmail(e.target.value)} />
      <input className="input" type="password" placeholder="Password" onChange={e=>setPassword(e.target.value)} />
      <button className="btn btn-primary">Login</button>
    </form>
  );
}
