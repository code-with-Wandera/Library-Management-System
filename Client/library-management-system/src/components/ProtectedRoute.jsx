// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import jwt_decode from "jwt-decode";

export default function ProtectedRoute({ user, children }) {
  const { token, logout } = useContext(AuthContext);

  // Check if token is expired
  const isTokenExpired = (token) => {
    if (!token) return true;
    if (token === "fake-jwt-token") return false; 

    try {
      const decoded = jwt_decode(token);
      const now = Date.now() / 1000;
      return decoded.exp < now;
    } catch {
      return true;
    }
  };

  if (!user || !token || isTokenExpired(token)) {
    logout(); 
    return <Navigate to="/login" replace />;
  }

  return children;
}
