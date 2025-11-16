import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useContext(AuthContext);
  if (isLoading) return <div className="p-8 text-center">Loading...</div>;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}