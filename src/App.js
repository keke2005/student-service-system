
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
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ProtectedRoute from "./components/ProtectedRoute";

import "./App.css";

function App() {
  const location = useLocation();

  // DARK AND LIGHT MODE
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

  // HIDE NAVBAR ON AUTHENTICATION PAGES
  const authPages = [
    "/login",
    "/register",
    "/forgot-password",
    "/verify-email"
  ];

  const isAuthPage = authPages.includes(location.pathname);

  return (
    <>
      {/* NAVIGATION WITH THEME TOGGLE */}
      {!isAuthPage && (
        <Navbar
          theme={theme}
          toggleTheme={toggleTheme}
        />
      )}

      {/* APPLICATION ROUTES */}
      <Routes>
        {/* PUBLIC AUTHENTICATION PAGES */}
        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        {/* PROTECTED STUDENT PORTAL */}
        <Route element={<ProtectedRoute />}>
          <Route
            path="/"
            element={<Navigate to="/home" replace />}
          />

          <Route path="/home" element={<Home />} />

          <Route path="/services" element={<Services />} />

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

              <Link to="/home" className="primary-btn">
                Back to Home
              </Link>
            </div>
          }
        />
      </Routes>

      {/* FOOTER */}
      {!isAuthPage && <Footer />}
    </>
  );
}

export default App;
