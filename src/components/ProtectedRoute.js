
import React from "react";
import {
  Navigate,
  Outlet,
  useLocation
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute() {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  // Wait for Firebase and StudentServe authorization.
  if (loading) {
    return (
      <div className="portal-loading" role="status">
        Checking your StudentServe account...
      </div>
    );
  }

  // No approved session.
  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  // Administrators cannot access student-only routes.
  if (role === "admin") {
    return (
      <Navigate
        to="/admin/dashboard"
        replace
      />
    );
  }

  // Only approved, verified Google students may continue.
  if (
    role !== "student" ||
    !user.emailVerified
  ) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return <Outlet />;
}
