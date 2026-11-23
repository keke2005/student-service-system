
import React from "react";
import {
  Navigate,
  Outlet
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export default function AdminRoute() {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <main className="portal-loading" role="status">
        Checking administrator access...
      </main>
    );
  }

  if (!user) {
    return (
      <Navigate
  to="/login"
  replace
/>
    );
  }

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
