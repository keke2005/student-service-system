
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  signOut
} from "firebase/auth";

import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    studentId: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // VALIDATE INDIVIDUAL FIELDS
  const validateField = (name, value) => {
    switch (name) {
      case "fullName":
        if (!value.trim()) return "Full name is required.";

        if (!/^[A-Za-z ]+$/.test(value)) {
          return "Full name must contain letters only.";
        }

        return "";

      case "studentId":
        if (!value.trim()) return "Student ID is required.";

        if (!/^\d+$/.test(value)) {
          return "Student ID must contain numbers only.";
        }

        return "";

      case "email":
        if (!value.trim()) return "Email is required.";

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return "Enter a valid email address.";
        }

        return "";

      case "password":
        if (!value) return "Password is required.";

        if (value.length < 6) {
          return "Password must contain at least 6 characters.";
        }

        return "";

      case "confirmPassword":
        if (!value) return "Please confirm your password.";

        if (value !== formData.password) {
          return "Passwords do not match.";
        }

        return "";

      default:
        return "";
    }
  };

  // BLOCK INVALID CHARACTERS WHILE TYPING
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Full Name: letters and spaces only
    if (name === "fullName" && !/^[A-Za-z ]*$/.test(value)) {
      setErrors((prev) => ({
        ...prev,
        fullName: "Numbers and special characters are not allowed."
      }));
      return;
    }

    // Student ID: digits only
    if (name === "studentId" && !/^\d*$/.test(value)) {
      setErrors((prev) => ({
        ...prev,
        studentId: "Only numbers are allowed."
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: name === "confirmPassword"
        ? value === formData.password
          ? ""
          : "Passwords do not match."
        : validateField(name, value),

      ...(name === "password" ? {
        confirmPassword:
          formData.confirmPassword &&
          formData.confirmPassword !== value
            ? "Passwords do not match."
            : ""
      } : {})
    }));

    setError("");
  };

  // VALIDATE WHEN LEAVING A FIELD
  const handleBlur = (e) => {
    const { name, value } = e.target;

    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, value)
    }));
  };

  // VALIDATE ENTIRE FORM
  const validateForm = () => {
    const newErrors = {};

    Object.keys(formData).forEach((name) => {
      const message = validateField(name, formData[name]);

      if (message) {
        newErrors[name] = message;
      }
    });

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // REGISTER STUDENT WITH FIREBASE
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (loading || !validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const result = await createUserWithEmailAndPassword(
        auth,
        formData.email.trim(),
        formData.password
      );

      await updateProfile(result.user, {
        displayName: formData.fullName.trim()
      });

      await setDoc(doc(db, "users", result.user.uid), {
        fullName: formData.fullName.trim(),
        studentId: formData.studentId,
        email: result.user.email,
        createdAt: new Date().toISOString()
      });

      await sendEmailVerification(result.user);
      await signOut(auth);

      setSuccess(true);

    } catch (err) {
      console.error("Registration error:", err);

      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered.");
      } else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (err.code === "auth/weak-password") {
        setError("Please choose a stronger password.");
      } else {
        setError(
          "Registration could not finish: " +
          err.message +
          ". If your account was created, try signing in."
        );
      }

    } finally {
      setLoading(false);
    }
  };

  // REGISTRATION SUCCESS
  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h2>Registration Successful!</h2>

          <p>
            Your account has been created.
            Check your email for a verification
            link before logging in.
          </p>

          <button
            className="auth-btn"
            onClick={() => navigate("/login")}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-heading">
          <span>STUDENTSERVE</span>
          <h1>Create Account</h1>
          <p>Register to access student services.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>

          {/* FULL NAME */}
          <div className="auth-group">
            <label htmlFor="fullName">Full Name *</label>

            <input
              id="fullName"
              type="text"
              name="fullName"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={!!errors.fullName}
              required
            />

            {errors.fullName && (
              <small className="error-text">
                {errors.fullName}
              </small>
            )}
          </div>

          {/* STUDENT ID */}
          <div className="auth-group">
            <label htmlFor="studentId">Student ID *</label>

            <input
              id="studentId"
              type="text"
              inputMode="numeric"
              name="studentId"
              placeholder="Enter your student ID"
              value={formData.studentId}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={!!errors.studentId}
              required
            />

            {errors.studentId && (
              <small className="error-text">
                {errors.studentId}
              </small>
            )}
          </div>

          {/* EMAIL */}
          <div className="auth-group">
            <label htmlFor="email">Email Address *</label>

            <input
              id="email"
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={!!errors.email}
              required
            />

            {errors.email && (
              <small className="error-text">
                {errors.email}
              </small>
            )}
          </div>

          {/* PASSWORD */}
          <div className="auth-group">
            <label htmlFor="password">Password *</label>

            <input
              id="password"
              type="password"
              name="password"
              placeholder="Create password"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={!!errors.password}
              required
            />

            {errors.password && (
              <small className="error-text">
                {errors.password}
              </small>
            )}
          </div>

          {/* CONFIRM PASSWORD */}
          <div className="auth-group">
            <label htmlFor="confirmPassword">
              Confirm Password *
            </label>

            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={!!errors.confirmPassword}
              required
            />

            {errors.confirmPassword && (
              <small className="error-text">
                {errors.confirmPassword}
              </small>
            )}
          </div>

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="auth-btn"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="auth-bottom">
          Already have an account?{" "}
          <Link to="/login">Login</Link>
        </p>

      </div>
    </div>
  );
}

export default Register;
