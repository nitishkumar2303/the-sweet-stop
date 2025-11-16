import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function Register() {
  const { register } = useContext(AuthContext);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const nav = useNavigate();

  const handle = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setError("All fields are required.");
      return;
    }

    setLoading(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      nav("/login");
    } catch (err) {
      setError(err?.response?.data?.error || "Registration failed.");
    } finally {
      setLoading(false);
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
            <div className="text-4xl font-extrabold text-pink-400">Sweet Shop</div>
            <div className="text-sm text-gray-500 mt-1">Your daily dose of happiness!</div>
          </div>

          <h2 className="text-center mt-8 text-2xl font-bold text-zinc-900">
            Create Your Account
          </h2>

          <form onSubmit={submit} className="mt-6 space-y-5" noValidate>
            {error && (
              <div className="text-red-600 bg-red-100 text-center p-2 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Full Name</label>
              <input
                name="name"
                value={form.name}
                onChange={handle}
                placeholder="John Doe"
                className="w-full px-4 py-3 rounded-md bg-zinc-800 text-white placeholder-zinc-400
                           shadow-inner focus:outline-none focus:ring-2 focus:ring-pink-300"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Email Address</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handle}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-md bg-zinc-800 text-white placeholder-zinc-400
                           shadow-inner focus:outline-none focus:ring-2 focus:ring-pink-300"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Password</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handle}
                placeholder="Create a password"
                className="w-full px-4 py-3 rounded-md bg-zinc-800 text-white placeholder-zinc-400
                           shadow-inner focus:outline-none focus:ring-2 focus:ring-pink-300"
              />
            </div>

            {/* Button */}
            <button
              disabled={loading}
              className="w-full py-3 rounded-md text-white font-semibold text-lg
                         bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600
                         shadow-sm disabled:opacity-60"
            >
              {loading ? "Creating Account..." : "Register"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-700">
            Already have an account?{" "}
            <Link to="/login" className="text-pink-500 font-medium hover:underline">
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}