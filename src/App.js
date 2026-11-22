
import React, { useEffect, useState } from "react";
import {
  Routes,
  Route,
  Link,
  useLocation,
  Navigate
} from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Services from "./pages/Services";
import ServiceDetails from "./pages/ServiceDetails";
import RequestForm from "./pages/RequestForm";
import RequestConfirmation from "./pages/RequestConfirmation";
import MyRequests from "./pages/MyRequests";
import Login from "./pages/Login";
import Profile from "./pages/Profile";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminRoute from "./components/AdminRoute";

import { useAuth } from "./context/AuthContext";

import "./App.css";

function App() {
  const location = useLocation();
  const { user, role, loading } = useAuth();

  // Global Light / Dark Mode
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("studentserve-theme") || "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("studentserve-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) =>
      current === "dark" ? "light" : "dark"
    );
  };

  // Pages that should not show student navigation
  const authPages = [
    "/login",
    "/admin/login"
  ];

  const isAdminPage =
    location.pathname.startsWith("/admin");

  const isAuthPage =
    authPages.includes(location.pathname) || isAdminPage;

  const showStudentLayout =
    !loading &&
    Boolean(user) &&
    role === "student" &&
    !isAuthPage;

  return (
    <>
      {/* STUDENT NAVBAR */}
      {showStudentLayout && (
        <Navbar
          theme={theme}
          toggleTheme={toggleTheme}
        />
      )}

      <Routes>
        {/* LOGIN */}
        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={
            <Navigate to="/login" replace />
          }
        />

        <Route
          path="/forgot-password"
          element={
            <Navigate to="/login" replace />
          }
        />

        <Route
          path="/verify-email"
          element={
            <Navigate to="/login" replace />
          }
        />

        {/* ADMIN LOGIN */}
        <Route
          path="/admin/login"
          element={<AdminLogin />}
        />

        {/* ADMIN PROTECTED ROUTES */}
        <Route element={<AdminRoute />}>
          <Route
            path="/admin/dashboard"
            element={
              <AdminDashboard
                theme={theme}
                toggleTheme={toggleTheme}
              />
            }
          />
        </Route>

        {/* STUDENT PROTECTED ROUTES */}
        <Route element={<ProtectedRoute />}>
          <Route
            path="/"
            element={
              <Navigate to="/home" replace />
            }
          />

          <Route
            path="/home"
            element={<Home />}
          />

          <Route
            path="/services"
            element={<Services />}
          />

          <Route
            path="/services/:id"
            element={<ServiceDetails />}
          />

          <Route
            path="/request/:id"
            element={<RequestForm />}
          />

          <Route
            path="/request-confirmation"
            element={<RequestConfirmation />}
          />

          <Route
            path="/requests"
            element={<MyRequests />}
          />

          <Route
            path="/profile"
            element={<Profile />}
          />
        </Route>

        {/* PAGE NOT FOUND */}
        <Route
          path="*"
          element={
            <div className="not-found">
              <h1>Page Not Found</h1>

              <p>
                The page you are looking for does not exist.
              </p>

              <Link
                to="/home"
                className="primary-btn"
              >
                Back to Home
              </Link>
            </div>
          }
        />
      </Routes>

      {/* STUDENT FOOTER */}
      {showStudentLayout && <Footer />}
    </>
  );
}

export default App;
