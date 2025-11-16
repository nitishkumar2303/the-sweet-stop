import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function Header() {
  const { user, isAuthenticated, logout } = useContext(AuthContext);

  return (
    <header className="bg-zinc-800 p-4">
      <div className="max-w-5xl mx-auto flex justify-between items-center">
        <Link to="/" className="text-lg font-bold text-white">SweetStop</Link>
        <div className="space-x-4">
          {!isAuthenticated ? (
            <>
              <Link to="/login" className="text-sm text-zinc-300">Login</Link>
              <Link to="/register" className="text-sm text-zinc-300">Register</Link>
            </>
          ) : (
            <>
              <span className="text-sm text-zinc-300">{user?.name || user?.email}</span>
              <button onClick={logout} className="text-sm text-white bg-red-600 px-2 py-1 rounded">Logout</button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}