
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    if (busy) return;

    setBusy(true);
    setError("");

    try {
      const { user } = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      await user.reload();

      if (!auth.currentUser?.emailVerified) {
        throw new Error("Email must be verified before staff access.");
      }

      const role = await getDoc(doc(db, "admins", user.uid));

      if (!role.exists() || role.data().active !== true) {
        throw new Error(
          "This account is not authorized as an administrator."
        );
      }

      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      await signOut(auth).catch(() => {});

      setError(
        err.message?.includes("authorized") ||
        err.message?.includes("verified")
          ? err.message
          : "Login failed. Check your staff credentials."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="staff-login-page">
      <div className="staff-login-shell">
        <div className="staff-login-brand">
          <img
            src="/images/LIMKOS.png"
            alt="Limkokwing University"
          />
          <h1>Admin Login</h1>
        </div>

        <section className="staff-login-form">
          <form onSubmit={submit}>
            <label htmlFor="staff-email">Email</label>
            <input
              id="staff-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />

            <label htmlFor="staff-password">Password</label>
            <input
              id="staff-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />

            {error && (
              <p className="staff-error" role="alert">
                {error}
              </p>
            )}

            <button type="submit" disabled={busy}>
              {busy ? "Signing in..." : "Login"}
            </button>
          </form>

          <Link to="/login" className="staff-back">
            Back to Student Login
          </Link>
        </section>
      </div>
    </main>
  );
}
