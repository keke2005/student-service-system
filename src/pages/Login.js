
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from "firebase/auth";

import { auth } from "../firebase";
import { useAuth } from "../context/AuthContext";

const API_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshAuthorization } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const from = location.state?.from;

  const destination =
    from?.pathname &&
    from.pathname !== "/login" &&
    !from.pathname.startsWith("/admin")
      ? from.pathname + (from.search || "")
      : "/services";

  async function handleGoogle() {
    if (loading) return;

    setError("");
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();

      provider.setCustomParameters({
        prompt: "select_account"
      });

      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;

      if (!googleUser.emailVerified) {
        throw new Error(
          "Your Google account email is not verified."
        );
      }

      const token = await googleUser.getIdToken();

      const response = await fetch(
        `${API_URL}/api/students/activate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Your student account has not been approved."
        );
      }

      const authorized = await refreshAuthorization(
        auth.currentUser
      );

      if (!authorized) {
        throw new Error(
          "StudentServe could not confirm your access. Please try again."
        );
      }

      navigate(destination, {
        replace: true
      });

    } catch (err) {
      try {
        await signOut(auth);
      } catch (signOutError) {
        console.error("Sign-out failed:", signOutError);
      }

      if (err.code === "auth/popup-closed-by-user") {
        setError("Google sign-in was cancelled.");
      } else if (err.code === "auth/popup-blocked") {
        setError("Please allow Google sign-in popups.");
      } else if (
        err.code ===
        "auth/account-exists-with-different-credential"
      ) {
        setError(
          "This email uses another sign-in method. Contact the administrator."
        );
      } else if (err instanceof TypeError) {
        setError(
          "Unable to connect to StudentServe. Check that the backend is running."
        );
      } else {
        setError(
          err.message ||
            "Google sign-in failed. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="student-login-page">
      <div className="student-login-container">
        <section className="student-login-form-panel">
          <div className="student-login-form-content">

            <img
              src="/images/LIMKOS.png"
              alt="Limkokwing University"
              className="student-login-logo"
            />

            <div className="student-login-heading">
              <h1>Student Login</h1>
            </div>

            <button
              className="google-login-button"
              type="button"
              onClick={handleGoogle}
              disabled={loading}
            >
              {loading
                ? "Verifying your account..."
                : "Continue with Google"}
            </button>

            {error && (
              <p
                className="student-login-error"
                role="alert"
              >
                {error}
              </p>
            )}

            <p className="student-login-notice">
              Only students registered by the university
              administrator can access this portal.
            </p>

            <div className="student-admin-entry">
              <Link to="/admin/login">
                Admin Login
              </Link>
            </div>

          </div>
        </section>
      </div>
    </main>
  );
}
