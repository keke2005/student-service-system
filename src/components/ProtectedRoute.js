import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="portal-loading">Checking your account...</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!user.emailVerified) return <Navigate to="/verify-email" state={{ from: location }} replace />;
  return <Outlet />;
}
