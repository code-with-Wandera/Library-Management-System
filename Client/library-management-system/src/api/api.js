import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api", 
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, 
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
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    // 1. Handle Request Cancellation (from AbortController)
    if (axios.isCancel(error)) {
      console.log("Request canceled:", error.message);
      return Promise.reject(error);
    }

    // 2. Handle Network Errors
    if (!error.response) {
      console.error("Network error:", error);
      return Promise.reject({ message: "Network error. Please check your connection." });
    }

    const { status, data } = error.response;

    // 3. Handle 429 - Too Many Requests (The fix for your current issue)
    if (status === 429) {
      console.error("Rate limit exceeded (429)");
      // Optional: You could implement a 'wait and retry' logic here
      return Promise.reject({ 
        message: "You're moving too fast! Please wait a moment before trying again.",
        isRateLimit: true 
      });
    }

    // 4. Handle 401 - Unauthorized
    if (status === 401) {
      console.warn("Unauthorized: Session expired or invalid token.");
      localStorage.removeItem("token"); // Clean up
      // window.location.href = "/login"; // Force redirect if needed
    }

    // 5. Handle Server Errors
    if (status >= 500) {
      console.error("Server error:", data);
      return Promise.reject({ message: "Server is currently struggling. Try again later." });
    }

    // Return backend error message or default object
    return Promise.reject(data || { message: "An unexpected error occurred." });
  }
);

export default API;