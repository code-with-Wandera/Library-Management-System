// src/context/AuthContext.jsx
import { createContext, useState, useEffect, useCallback } from "react";
import jwt_decode from "jwt-decode"; // no * import needed

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const storedToken = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");

  const [user, setUser] = useState(storedUser ? JSON.parse(storedUser) : null);
  const [token, setToken] = useState(storedToken || null);

  // Helper: check if token is expired
  const isTokenExpired = useCallback((token) => {
    if (!token) return true;
    if (token === "fake-jwt-token") return false; // keep admin fake token valid

    try {
      const decoded = jwt_decode(token);
      const now = Date.now() / 1000; // seconds
      return decoded.exp < now;
    } catch {
      return true; // invalid token
    }
  }, []);

  // Auto-logout if token expires
  useEffect(() => {
    if (token && isTokenExpired(token)) {
      logout();
    }
  }, [token, isTokenExpired]);

  // Login function
  function login({ token, user }) {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setToken(token);
    setUser(user);
  }

  // Logout function
  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  }

  // Optional: auto-restore session if token is valid
  useEffect(() => {
    if (token && !user && !isTokenExpired(token)) {
      try {
        const decoded = jwt_decode(token);
        setUser({ id: decoded.id, role: decoded.role });
      } catch {
        logout();
      }
    }
  }, [token, user, isTokenExpired]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
