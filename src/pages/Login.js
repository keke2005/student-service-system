
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
  reload
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useAuth } from "../context/AuthContext";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:500";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshAuthorization } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function finishLogin(firebaseUser) {
    await reload(firebaseUser);

    const adminSnapshot = await getDoc(
      doc(db, "admins", firebaseUser.uid)
    );

    if (
      adminSnapshot.exists() &&
      adminSnapshot.data().active === true
    ) {
      const authorized = await refreshAuthorization(firebaseUser);

      if (!authorized) {
        throw new Error("Unable to verify administrator access.");
      }

      navigate("/admin/dashboard", { replace: true });
      return;
    }

    if (!firebaseUser.emailVerified) {
      throw new Error(
        "Please verify your email address before signing in."
      );
    }

    const token = await firebaseUser.getIdToken(true);

    const response = await fetch(
      `${API_URL}/api/students/activate`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.success !== true) {
      throw new Error(
        data.message || "Your student account is not approved or active."
      );
    }

    const authorized = await refreshAuthorization(firebaseUser);

    if (!authorized) {
      throw new Error("Unable to verify your student account.");
    }

    const requestedPath = location.state?.from?.pathname;

    const destination =
      requestedPath &&
      requestedPath !== "/login" &&
      !requestedPath.startsWith("/admin")
        ? requestedPath
        : "/home";

    navigate(destination, { replace: true });
  }

  async function handleEmailLogin(event) {
    event.preventDefault();

    if (loading) return;

    setError("");
    setLoading(true);

    try {
      const result = await signInWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password
      );

      await finishLogin(result.user);
    } catch (err) {
      await signOut(auth).catch(() => {});

      setError(
        err.code === "auth/invalid-credential"
          ? "Incorrect email or password."
          : err.message || "Sign-in failed."
      );
    } finally {
      setLoading(false);
    }
  }

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

      await finishLogin(result.user);
    } catch (err) {
      await signOut(auth).catch(() => {});

      if (err.code === "auth/popup-closed-by-user") {
        setError("Google sign-in was cancelled.");
      } else if (err.code === "auth/popup-blocked") {
        setError("Please allow Google sign-in popups.");
      } else {
        setError(err.message || "Google sign-in failed.");
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
              <h1>StudentServe Login</h1>
            </div>

            <form onSubmit={handleEmailLogin}>
              <div className="form-group">
                <label htmlFor="login-email">
                  Email Address
                </label>

                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="login-password">
                  Password
                </label>

                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  required
                />
              </div>

              <button
                type="submit"
                className="student-login-submit"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <p className="login-divider">OR</p>

            <button
              className="google-login-button"
              type="button"
              onClick={handleGoogle}
              disabled={loading}
            >
              Continue with Google
            </button>

            {error && (
              <p
                className="student-login-error"
                role="alert"
              >
                {error}
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
