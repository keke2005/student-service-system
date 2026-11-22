
import React from "react";
import {
  Navigate,
  Outlet
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export default function AdminRoute() {
  const { user, role, loading } = useAuth();

  // Wait for Firebase and administrator authorization.
  if (loading) {
    return (
      <main className="portal-loading" role="status">
        Checking administrator access...
      </main>
    );
  }

  // No authorized user: return to administrator login.
  if (!user) {
    return (
      <Navigate
        to="/admin/login"
        replace
      />
    );
  }

  // Only active administrators can access this route.
  if (role !== "admin") {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return <Outlet />;
}
