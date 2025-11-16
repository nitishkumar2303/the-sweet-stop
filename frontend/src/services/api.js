import axios from "axios";

// base URL taken from Vite env (VITE_API_URL). Falls back to localhost dev backend.
const base = import.meta.env.VITE_API_URL || "http://localhost:5050/api";

const api = axios.create({
  baseURL: base,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach token automatically (if present)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      // make sure Authorization header uses correct casing
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global response handler: auto-logout on 401 to avoid infinite loops
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      // unauthorized — remove token and redirect to login
      try {
        localStorage.removeItem("token");
        // if running in browser, navigate to login
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      } catch (e) {
        // ignore
      }
    }
    return Promise.reject(error);
  }
);

/* ------------ AUTH ------------ */
export const register = (userData) => api.post("/auth/register", userData);
export const login = (credentials) => api.post("/auth/login", credentials);
// export const getMe = () => api.get("/auth/me");

/* ------------ SWEETS ------------ */
// list sweets, optionally accepts params { page, limit, q, category }
export const getSweets = (params) => api.get("/sweets", { params });
export const searchSweets = (params) => api.get("/sweets/search", { params });


export const createSweet = (data) => api.post("/sweets", data); // admin
export const updateSweet = (id, data) => api.put(`/sweets/${id}`, data); // admin
export const deleteSweet = (id) => api.delete(`/sweets/${id}`); // admin

export const restockSweet = (id, qty) =>
  api.post(`/sweets/${id}/restock`, { quantity: qty }); // admin

export const purchaseSweet = (id, qty) =>
  api.post(`/sweets/${id}/purchase`, { quantity: qty }); // users

export default api;
