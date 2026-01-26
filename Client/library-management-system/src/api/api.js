import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api", // your backend
  headers: {
    "Content-Type": "application/json", // ensure backend treats data as JSON
  },
});

// Attach token automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
