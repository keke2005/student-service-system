import React, { useState } from "react";
import { Link } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setMessage("If an account exists for this email, a password reset link will be sent.");
    } catch (error) {
      setMessage("Unable to send a reset email right now. Please try again.");
    } finally { setLoading(false); }
  }
  return <main className="auth-page"><div className="auth-card">
    <div className="auth-heading"><span>STUDENTSERVE</span><h1>Reset Password</h1><p>We'll email you a password reset link.</p></div>
    <form onSubmit={handleSubmit}><div className="auth-group"><label htmlFor="reset-email">Email Address</label><input id="reset-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required /></div>
    {message && <p role="status">{message}</p>}<button className="auth-btn" disabled={loading}>{loading ? "Sending..." : "Send Reset Link"}</button></form>
    <p className="auth-bottom"><Link to="/login">Back to Login</Link></p>
  </div></main>;
}
