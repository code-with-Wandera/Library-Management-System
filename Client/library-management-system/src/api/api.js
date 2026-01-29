import axios from "axios";

// Create Axios instance
const API = axios.create({
  baseURL: "http://localhost:5000/api", 
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 seconds timeout
});

// Request interceptor to add JWT token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common errors here
    if (!error.response) {
      console.error("Network error:", error);
      return Promise.reject({ message: "Network error. Please try again." });
    }

    const { status, data } = error.response;

    if (status === 401) {
      console.warn("Unauthorized - maybe redirect to login");
      // Optional: redirect to login page
    }

    if (status >= 500) {
      console.error("Server error:", data);
      return Promise.reject({ message: "Server error. Please try again later." });
    }

    // Return backend error message
    return Promise.reject(data);
  }
);

export default API;
