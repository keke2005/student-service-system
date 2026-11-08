import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../firebase";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const from = location.state?.from;
  const destination = from?.pathname && from.pathname !== "/login"
    ? from.pathname + (from.search || "") : "/services";

  async function handleLogin(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email.trim(), password);
      await result.user.reload();
      if (!auth.currentUser?.emailVerified) {
        await signOut(auth);
        navigate("/verify-email", { state: { email: email.trim(), from }, replace: true });
        return;
      }
      navigate(destination, { replace: true });
    } catch (err) {
      setError("Unable to sign in. Check your email and password and try again.");
    } finally {
      setLoading(false);
    }
  }

  return <main className="student-login-page">
    <div className="student-login-container">
      <section className="student-login-welcome">
        <img src="/images/LIMKOS.png" alt="Limkokwing University of Creative Technology" className="student-login-logo" />
        <span className="student-login-eyebrow">LIMKOKWING UNIVERSITY</span>
        <h1>Welcome to StudentServe</h1>
        <p>Your university services, all in one place. Sign in to explore services, submit requests and track progress.</p>
        <div className="student-login-illustration" aria-hidden="true">🎓 📚 📝</div>
        <p className="student-login-caption">Making student services easier.</p>
      </section>
      <section className="student-login-form-panel">
        <div className="student-login-form-content">
          <span className="student-login-label">STUDENT PORTAL</span>
          <h2>Login to Your Account</h2>
          <p className="student-login-subtitle">Enter your details to continue.</p>
          <form onSubmit={handleLogin}>
            <div className="student-login-field">
              <label htmlFor="login-email">Email Address</label>
              <input id="login-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="student@email.com" autoComplete="email" required />
            </div>
            <div className="student-login-field">
              <label htmlFor="login-password">Password</label>
              <div className="student-login-password">
                <input id="login-password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "Hide" : "Show"}</button>
              </div>
            </div>
            <div className="student-login-options"><Link to="/forgot-password">Forgot password?</Link></div>
            {error && <p className="student-login-error" role="alert">{error}</p>}
            <button className="student-login-submit" type="submit" disabled={loading}>{loading ? "Signing in..." : "Log In"}</button>
          </form>
          <p className="student-login-register">Don't have an account? <Link to="/register" state={{ from }}>Sign Up</Link></p>
          <Link className="student-login-home" to="/">← Back to Home</Link>
        </div>
      </section>
    </div>
  </main>;
}
