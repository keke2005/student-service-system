
import React, {
  useState,
  useEffect,
  useRef
} from "react";

import {
  NavLink,
  useNavigate,
  useLocation
} from "react-router-dom";

import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useAuth } from "../context/AuthContext";

export default function Navbar({
  theme,
  toggleTheme
}) {
  const { user, role, profile, loading } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const dropdownRef = useRef(null);

  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const studentName =
    profile?.fullName ||
    user?.displayName ||
    "Student";

  const studentId = profile?.studentId || "";

  const initials = studentName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((name) => name.charAt(0).toUpperCase())
    .join("");

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setProfileOpen(false);
        setMobileOpen(false);
      }
    }

    document.addEventListener(
      "pointerdown",
      handleOutsideClick
    );

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handleOutsideClick
      );

      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);

  // Close menus when changing pages
  useEffect(() => {
    setProfileOpen(false);
    setMobileOpen(false);
  }, [location.pathname, location.search]);

  // Reset image error when user changes
  useEffect(() => {
    setImageFailed(false);
  }, [user?.photoURL]);

  // Sign out
  async function logout() {
    try {
      setProfileOpen(false);

      await signOut(auth);

      navigate("/login", {
        replace: true
      });
    } catch (err) {
      console.error("Logout error:", err);

      alert("Unable to log out. Please try again.");
    }
  }

  // Display navigation only for approved students
  if (loading || !user || role !== "student") {
    return null;
  }

  // Google profile picture or initials
  const renderAvatar = (className) => {
    if (user.photoURL && !imageFailed) {
      return (
        <img
          src={user.photoURL}
          alt=""
          className={className}
          onError={() => setImageFailed(true)}
          referrerPolicy="no-referrer"
        />
      );
    }

    return (
      <span className={className}>
        {initials}
      </span>
    );
  };

  return (
    <nav className="navbar student-navbar">

      {/* UNIVERSITY LOGO */}
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

      {/* STUDENT NAVIGATION */}
      <div
        id="student-navigation"
        className={`nav-links ${
          mobileOpen ? "mobile-open" : ""
        }`}
      >

        <NavLink to="/home">
          Home
        </NavLink>

        <NavLink to="/services">
          Services
        </NavLink>

        <NavLink to="/requests">
          My Requests
        </NavLink>

      </div>

      {/* NAVIGATION ACTIONS */}
      <div className="nav-actions">

        {/* THEME TOGGLE */}
        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label="Toggle colour theme"
        >
          {theme === "dark" ? "Light" : "Dark"}
        </button>

        {/* STUDENT PROFILE */}
        <div
          className="student-profile-wrapper"
          ref={dropdownRef}
        >

          <button
            type="button"
            className="student-profile-trigger"
            onClick={() =>
              setProfileOpen((previous) => !previous)
            }
            aria-label="Open student profile"
            aria-expanded={profileOpen}
            aria-controls="student-profile-dropdown"
          >

            {renderAvatar("student-nav-avatar")}

            <span className="student-nav-name">
              {studentName.split(" ")[0]}
            </span>

            <span className="profile-chevron">
              {profileOpen ? "▲" : "▼"}
            </span>

          </button>

          {/* PROFILE DROPDOWN */}
          {profileOpen && (
            <div
              id="student-profile-dropdown"
              className="student-profile-dropdown"
            >

              {/* PROFILE SUMMARY */}
              <div className="dropdown-profile-header">

                {renderAvatar(
                  "dropdown-profile-avatar"
                )}

                <div className="dropdown-profile-info">

                  <h4>{studentName}</h4>

                  <p>{studentId}</p>

                  <span className="verified-student-label">
                    ✓ Verified Student
                  </span>

                </div>

              </div>

              <div className="profile-dropdown-divider" />

              {/* MY PROFILE */}
              <NavLink
                to="/profile"
                className="profile-dropdown-link"
                onClick={() => setProfileOpen(false)}
              >
                <span>My Profile</span>
                <span>›</span>
              </NavLink>

              {/* EDIT PERSONAL INFORMATION */}
              <NavLink
                to="/profile?edit=true"
                className="profile-dropdown-link"
                onClick={() => setProfileOpen(false)}
              >
                <span>Edit Personal Information</span>
                <span>›</span>
              </NavLink>

              {/* MY REQUESTS */}
              <NavLink
                to="/requests"
                className="profile-dropdown-link"
                onClick={() => setProfileOpen(false)}
              >
                <span>My Requests</span>
                <span>›</span>
              </NavLink>

              <div className="profile-dropdown-divider" />

              {/* SIGN OUT */}
              <button
                type="button"
                className="profile-logout-button"
                onClick={logout}
              >
                Sign Out
              </button>

            </div>
          )}

        </div>

        {/* MOBILE MENU BUTTON */}
        <button
          type="button"
          className="student-mobile-toggle"
          aria-label="Toggle navigation"
          aria-expanded={mobileOpen}
          aria-controls="student-navigation"
          onClick={() =>
            setMobileOpen((previous) => !previous)
          }
        >
          {mobileOpen ? "✕" : "☰"}
        </button>

      </div>

    </nav>
  );
}
