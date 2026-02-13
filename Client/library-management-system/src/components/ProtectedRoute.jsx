import { Navigate } from "react-router-dom";
import { useContext, useEffect } from "react"; // Added useEffect
import { AuthContext } from "../context/AuthContext";
import jwt_decode from "jwt-decode";

export default function ProtectedRoute({ user, children }) {
  const { token, logout } = useContext(AuthContext);

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

  const expired = !user || !token || isTokenExpired(token);

  // Trigger the logout side-effect safely
  useEffect(() => {
    if (expired) {
      logout();
    }
  }, [expired, logout]);

  // If expired, redirect. If not, show the protected content.
  if (expired) {
    return <Navigate to="/login" replace />;
  }

  return children;
}