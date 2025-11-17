// frontend/src/pages/Login.jsx
import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const { login } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setFormData((s) => ({ ...s, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!formData.email.trim() || !formData.password) {
      setError("Email and password are required.");
      setIsLoading(false);
      return;
    }

    try {
      // Trim email and call login
      const res = await login({
        email: formData.email.trim(),
        password: formData.password,
      });

      // Optional: log full response to debug shape
      console.log("login success response:", res);

      // Navigate to dashboard/home after successful login
      navigate("/");
    } catch (err) {
      console.error("Login error (full):", err);

      // Prefer backend error message if present
      const serverMsg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Login failed. Please check your credentials.";

      setError(serverMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // One-click demo login for hosted demo visitors (admin/user)
  const handleDemo = async (email, password) => {
    setError("");
    setIsLoading(true);
    try {
      await login({ email, password });
      navigate("/");
    } catch (err) {
      console.error("Demo login error:", err);
      const serverMsg =
        err?.response?.data?.error || err?.message || "Demo login failed.";
      setError(serverMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background:
          "radial-gradient(1200px 600px at 10% 10%, #f7e8f3 0%, transparent 10%), radial-gradient(900px 600px at 90% 90%, #f2e9fb 0%, transparent 10%), linear-gradient(90deg, #fffafc 0%, #f6f0ff 100%)",
      }}
    >
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="px-10 py-10">
          {/* Brand */}
          <div className="text-center">
            <div className="text-4xl font-extrabold text-pink-400">
              Sweet Shop
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Your daily dose of happiness!
            </div>
          </div>

          {/* Welcome */}
          <h2 className="text-center mt-8 text-2xl font-bold text-zinc-900">
            Welcome Back!
          </h2>

          <form className="mt-6" onSubmit={handleSubmit} noValidate>
            {/* Email (styled like dark input in your mock) */}
            <label className="block text-sm text-gray-600 mb-2">Email</label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
              className="w-full px-4 py-3 rounded-md bg-zinc-800 text-white placeholder-zinc-400 shadow-inner focus:outline-none focus:ring-2 focus:ring-pink-300"
            />

            {/* Password */}
            <label className="block text-sm text-gray-600 mt-4 mb-2">
              Password
            </label>
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              autoComplete="current-password"
              className="w-full px-4 py-3 rounded-md bg-zinc-800 text-white placeholder-zinc-400 shadow-inner focus:outline-none focus:ring-2 focus:ring-pink-300"
            />

            {/* Error */}
            {error && (
              <div className="mt-4 text-center text-sm text-red-600 bg-red-50 py-2 rounded">
                {error}
              </div>
            )}

            {/* Button */}
            <div className="mt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-md text-white font-semibold text-lg bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 shadow-sm disabled:opacity-60"
              >
                {isLoading ? "Signing in..." : "Login"}
              </button>
            </div>
          </form>

          {/* Sign up link */}
          <div className="mt-6 text-center">
            <Link
              to="/register"
              className="text-pink-500 font-medium hover:underline"
            >
              Don't have an account? Sign Up
            </Link>
          </div>

          {/* Divider */}
          <div className="mt-6 border-t pt-4 text-center">
            <div className="text-xs text-zinc-400">Demo Credentials:</div>
            <div className="mt-2 text-sm text-zinc-700">
              
              
              

              <div className="flex gap-3 justify-center mt-4">
                <button
                  type="button"
                  onClick={() => handleDemo("admin@example.com", "Admin123!")}
                  className="px-4 py-2 rounded-md bg-pink-500 text-white font-medium hover:bg-pink-600"
                >
                  Login as Admin
                </button>
                <button
                  type="button"
                  onClick={() => handleDemo("user@example.com", "User123!")}
                  className="px-4 py-2 rounded-md bg-zinc-800 text-white font-medium hover:bg-zinc-900"
                >
                  Login as User
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
