
import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { addDoc, collection, doc, getDoc } from "firebase/firestore";

import { services } from "../data/services";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

// GET TODAY'S DATE IN YYYY-MM-DD FORMAT
function today() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function RequestForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const selectedService = services.find(
    (service) => service.id === Number(id)
  );

  const [formData, setFormData] = useState({
    studentName: user?.displayName || "",
    studentId: "",
    email: user?.email || "",
    serviceId: selectedService ? String(selectedService.id) : "",
    description: "",
    requestDate: today()
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // LOAD STUDENT DETAILS FROM FIRESTORE
  useEffect(() => {
    if (!user) return;

    let active = true;

    getDoc(doc(db, "users", user.uid))
      .then((snapshot) => {
        if (!active) return;

        setFormData((prev) => ({
          ...prev,
          studentName:
            snapshot.data()?.fullName ||
            user.displayName ||
            "",
          studentId: snapshot.data()?.studentId || "",
          email: user.email || ""
        }));
      })
      .catch((error) => {
        console.error("Error loading student details:", error);
      });

    return () => {
      active = false;
    };
  }, [user]);

  // VALIDATE INDIVIDUAL FIELDS
  const validateField = (name, value) => {
    switch (name) {
      case "studentName":
        if (!value.trim()) {
          return "Full name is required.";
        }

        if (!/^[A-Za-z ]+$/.test(value)) {
          return "Name must contain letters only.";
        }

        return "";

      case "studentId":
        if (!value.trim()) {
          return "Student ID is required.";
        }

        if (!/^\d+$/.test(value)) {
          return "Student ID must contain numbers only.";
        }

        return "";

      case "email":
        if (!value.trim()) {
          return "Email address is required.";
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return "Enter a valid email address.";
        }

        if (value !== (user?.email || "")) {
          return "Email must match your logged-in account.";
        }

        return "";

      case "serviceId":
        if (!value) {
          return "Please select a service.";
        }

        if (
          !services.some(
            (service) => service.id === Number(value)
          )
        ) {
          return "Please select a valid service.";
        }

        return "";

      case "description":
        if (!value.trim()) {
          return "Request description is required.";
        }

        return "";

      case "requestDate":
        if (!value) {
          return "Request date is required.";
        }

        return "";

      default:
        return "";
    }
  };

  // HANDLE INPUT CHANGES
  const handleChange = (e) => {
    const { name, value } = e.target;

    // NAME: LETTERS AND SPACES ONLY
    if (
      name === "studentName" &&
      !/^[A-Za-z ]*$/.test(value)
    ) {
      setErrors((prev) => ({
        ...prev,
        studentName:
          "Numbers and special characters are not allowed."
      }));
      return;
    }

    // STUDENT ID: NUMBERS ONLY
    if (
      name === "studentId" &&
      !/^\d*$/.test(value)
    ) {
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
      [name]: validateField(name, value)
    }));

    setSubmitError("");
  };

  // VALIDATE WHEN LEAVING A FIELD
  const handleBlur = (e) => {
    const { name, value } = e.target;

    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, value)
    }));
  };

  // VALIDATE THE ENTIRE FORM
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

  // SUBMIT REQUEST TO FIRESTORE
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    if (!user || !user.emailVerified) {
      setSubmitError(
        "Please log in with a verified account."
      );
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setSubmitError("");

    try {
      const selected = services.find(
        (service) =>
          service.id === Number(formData.serviceId)
      );

      if (!selected) {
        setSubmitError("Please select a valid service.");
        return;
      }

      const requestData = {
        ownerUid: user.uid,
        studentName: formData.studentName.trim(),
        studentId: formData.studentId,
        email: user.email,
        serviceId: Number(formData.serviceId),
        serviceName: selected.name,
        description: formData.description.trim(),
        requestDate: formData.requestDate,
        status: "Pending"
      };

      // SAVE REQUEST TO FIRESTORE
      const docRef = await addDoc(
        collection(db, "requests"),
        requestData
      );

      const submittedRequest = {
        id: docRef.id,
        ...requestData
      };

      // CLEAR FORM AFTER SUCCESSFUL SUBMISSION
      setFormData({
        studentName: "",
        studentId: "",
        email: "",
        serviceId: "",
        description: "",
        requestDate: today()
      });

      setErrors({});

      // NAVIGATE TO CONFIRMATION PAGE
      navigate("/request-confirmation", {
        state: {
          request: submittedRequest
        },
        replace: true
      });

    } catch (error) {
      console.error("Firebase error:", error);

      setSubmitError(
        "Failed to submit request. Please try again."
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="request-page">

      <div className="request-header">
        <Link to="/services" className="back-link">
          ← Back to Services
        </Link>

        <span className="section-label">
          STUDENT SERVICES
        </span>

        <h1>Submit a Service Request</h1>

        <p>
          Complete the form below to request assistance
          from the university.
        </p>
      </div>

      <div className="request-container">
        <form
          className="request-form"
          onSubmit={handleSubmit}
          noValidate
        >

          <div className="form-heading">
            <h2>Student Information</h2>
            <p>Please enter your details correctly.</p>
          </div>

          <div className="form-row">

            <div className="form-group">
              <label htmlFor="studentName">
                Full Name *
              </label>

              <input
                id="studentName"
                type="text"
                name="studentName"
                placeholder="Enter your full name"
                value={formData.studentName}
                onChange={handleChange}
                onBlur={handleBlur}
                className={
                  errors.studentName ? "input-error" : ""
                }
                aria-invalid={!!errors.studentName}
              />

              {errors.studentName && (
                <small className="error-text" role="alert">
                  {errors.studentName}
                </small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="studentId">
                Student ID *
              </label>

              <input
                id="studentId"
                type="text"
                inputMode="numeric"
                name="studentId"
                placeholder="Enter your student ID"
                value={formData.studentId}
                onChange={handleChange}
                onBlur={handleBlur}
                className={
                  errors.studentId ? "input-error" : ""
                }
                aria-invalid={!!errors.studentId}
              />

              {errors.studentId && (
                <small className="error-text" role="alert">
                  {errors.studentId}
                </small>
              )}
            </div>

          </div>

          <div className="form-group">
            <label htmlFor="email">
              Email Address *
            </label>

            <input
              id="email"
              type="email"
              name="email"
              placeholder="Enter your email address"
              value={formData.email}
              readOnly
              onBlur={handleBlur}
              className={
                errors.email ? "input-error" : ""
              }
              aria-invalid={!!errors.email}
            />

            {errors.email && (
              <small className="error-text" role="alert">
                {errors.email}
              </small>
            )}
          </div>

          <div className="form-heading second-heading">
            <h2>Request Details</h2>
            <p>Tell us which service you need.</p>
          </div>

          <div className="form-row">

            <div className="form-group">
              <label htmlFor="serviceId">
                Service Required *
              </label>

              <select
                id="serviceId"
                name="serviceId"
                value={formData.serviceId}
                onChange={handleChange}
                onBlur={handleBlur}
                className={
                  errors.serviceId ? "input-error" : ""
                }
                aria-invalid={!!errors.serviceId}
              >
                <option value="">
                  Select a service
                </option>

                {services.map((service) => (
                  <option
                    key={service.id}
                    value={service.id}
                  >
                    {service.name}
                  </option>
                ))}
              </select>

              {errors.serviceId && (
                <small className="error-text" role="alert">
                  {errors.serviceId}
                </small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="requestDate">
                Date of Request *
              </label>

              <input
                id="requestDate"
                type="date"
                name="requestDate"
                value={formData.requestDate}
                onChange={handleChange}
                onBlur={handleBlur}
                className={
                  errors.requestDate ? "input-error" : ""
                }
                aria-invalid={!!errors.requestDate}
              />

              {errors.requestDate && (
                <small className="error-text" role="alert">
                  {errors.requestDate}
                </small>
              )}
            </div>

          </div>

          <div className="form-group">
            <label htmlFor="description">
              Description / Reason for Request *
            </label>

            <textarea
              id="description"
              name="description"
              rows="6"
              placeholder="Explain why you need this service..."
              value={formData.description}
              onChange={handleChange}
              onBlur={handleBlur}
              className={
                errors.description ? "input-error" : ""
              }
              aria-invalid={!!errors.description}
            />

            {errors.description && (
              <small className="error-text" role="alert">
                {errors.description}
              </small>
            )}
          </div>

          {submitError && (
            <p className="error-text" role="alert">
              {submitError}
            </p>
          )}

          <div className="form-actions">
            <Link
              to="/services"
              className="cancel-btn"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading
                ? "Submitting..."
                : "Submit Request →"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default RequestForm;
