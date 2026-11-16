
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useAuth } from "../context/AuthContext";

export default function Navbar({ theme, toggleTheme }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  async function logout() {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (err) {
      alert("Unable to log out. Please try again.");
    }
  }

  return (
    <nav className="navbar">
      <NavLink to="/home" className="logo">
        <img
          className="university-nav-logo"
          src="/images/LIMKOS.png"
          alt="Limkokwing University"
        />
        <div>
          <h2>StudentServe</h2>
          <p>LIMKOKWING UNIVERSITY</p>
        </div>
      </NavLink>

      <div className="nav-links">
        <NavLink to="/home">Home</NavLink>

        {!loading && user && user.emailVerified && (
          <>
            <NavLink to="/services">Services</NavLink>
            <NavLink to="/requests">My Requests</NavLink>
          </>
        )}

        {!loading && !user && (
          <>
            <NavLink to="/login">Login</NavLink>
            <NavLink to="/register">Register</NavLink>
          </>
        )}
      </div>

      <div className="nav-actions">
        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label="Toggle colour theme"
        >
          {theme === "dark" ? "Light" : "Dark"}
        </button>

        {!loading && user ? (
          <button
            type="button"
            className="nav-button"
            onClick={logout}
          >
            Logout
          </button>
        ) : (
          <NavLink className="nav-button" to="/login">
            Get Started
          </NavLink>
        )}
      </div>
    </nav>
  );
}
