import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { sendEmailVerification, signOut } from "firebase/auth";
import { auth } from "../firebase";

export default function VerifyEmail() {
  const location = useLocation();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function resend() {
    if (!auth.currentUser) { setMessage("Please log in again to resend verification."); return; }
    setBusy(true);
    try {
      await sendEmailVerification(auth.currentUser);
      setMessage("Verification email sent. Check your inbox and spam folder.");
      await signOut(auth);
    } catch (error) { setMessage("Could not send the email. Try again later."); }
    finally { setBusy(false); }
  }
  return <main className="auth-page"><div className="auth-card">
    <div className="auth-heading"><span>STUDENTSERVE</span><h1>Verify Your Email</h1>
      <p>Check {location.state?.email || "your inbox"} for a verification link. Open the link, then log in to access services.</p></div>
    {message && <p role="status">{message}</p>}
    <button className="auth-btn" onClick={resend} disabled={busy}>{busy ? "Sending..." : "Resend Verification Email"}</button>
    <p className="auth-bottom"><Link to="/login" state={{ from: location.state?.from }}>Go to Login</Link></p>
  </div></main>;
}
