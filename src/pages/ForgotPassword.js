
import React from "react";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1>Forgot Password?</h1>

        <p>
          Please contact the StudentServe administrator
          for help with resetting your password.
        </p>

        <Link to="/login" className="auth-btn">
          Back to Login
        </Link>
      </div>
    </main>
  );
}
