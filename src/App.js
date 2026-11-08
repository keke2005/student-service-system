
import React from "react";
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

  const authPages = [
    "/login",
    "/register",
    "/forgot-password",
    "/verify-email"
  ];

  const isAuthPage = authPages.includes(location.pathname);

  return (
    <>
      {!isAuthPage && <Navbar />}

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
          <Route path="/" element={<Navigate to="/home" replace />} />
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

        {/* 404 PAGE */}
        <Route
          path="*"
          element={
            <div className="not-found">
              <h1>Page Not Found</h1>
              <p>The page you are looking for does not exist.</p>
              <Link to="/home" className="primary-btn">
                Back to Home
              </Link>
            </div>
          }
        />
      </Routes>

      {!isAuthPage && <Footer />}
    </>
  );
}

export default App;
