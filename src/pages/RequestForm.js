
import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { addDoc, collection } from "firebase/firestore";

import { services } from "../data/services";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

// Get the current date in YYYY-MM-DD format
function getTodayDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function RequestForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, role, profile } = useAuth();

  const selectedService = services.find(
    (service) => String(service.id) === String(id)
  );

  const studentName = profile?.fullName || "";
  const studentId = profile?.studentId || "";
  const email = user?.email || "";

  const [formData, setFormData] = useState({
    serviceId: selectedService ? String(selectedService.id) : "",
    description: "",
    requestDate: getTodayDate()
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Check that the student has an approved account
  const accountReady = Boolean(
    user &&
    user.emailVerified &&
    role === "student" &&
    profile?.active === true &&
    profile?.fullName &&
    profile?.studentId &&
    email
  );

  // Update the selected service if the URL changes
  useEffect(() => {
    const service = services.find(
      (item) => String(item.id) === String(id)
    );

    setFormData((previous) => ({
      ...previous,
      serviceId: service ? String(service.id) : ""
    }));
  }, [id]);

  // Check the information entered in each field
  const validateField = (name, value) => {
    if (name === "serviceId") {
      if (!value) {
        return "Please select a service.";
      }

      const serviceExists = services.some(
        (service) => String(service.id) === String(value)
      );

      if (!serviceExists) {
        return "Please select a valid service.";
      }
    }

    if (name === "description") {
      if (!value.trim()) {
        return "Please explain why you need this service.";
      }

      if (value.trim().length > 5000) {
        return "Description cannot exceed 5000 characters.";
      }
    }

    if (name === "requestDate" && !value) {
      return "Request date is required.";
    }

    return "";
  };

  // Update the form when the student types or selects something
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: validateField(name, value)
    }));

    setSubmitError("");
  };

  // Check a field when the student leaves it
  const handleBlur = (event) => {
    const { name, value } = event.target;

    setErrors((previous) => ({
      ...previous,
      [name]: validateField(name, value)
    }));
  };

  // Check the whole form before submitting
  const validateForm = () => {
    const newErrors = {};

    Object.keys(formData).forEach((name) => {
      const error = validateField(name, formData[name]);

      if (error) {
        newErrors[name] = error;
      }
    });

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // Save the student's request to Firebase
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) return;

    setSubmitError("");

    if (!accountReady) {
      setSubmitError(
        "Your student account could not be verified. Please sign in again or contact the administrator."
      );
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const service = services.find(
        (item) => String(item.id) === String(formData.serviceId)
      );

      if (!service) {
        setSubmitError("Please select a valid service.");
        return;
      }

      // Information stored in the requests collection
      const requestData = {
        ownerUid: user.uid,
        studentName: profile.fullName,
        studentId: profile.studentId,
        email: user.email,
        serviceId: String(service.id),
        serviceName: service.name,
        description: formData.description.trim(),
        requestDate: formData.requestDate,
        status: "Pending"
      };

      const savedRequest = await addDoc(
        collection(db, "requests"),
        requestData
      );

      // Open the confirmation page after successful submission
      navigate("/request-confirmation", {
        state: {
          request: {
            id: savedRequest.id,
            ...requestData
          }
        },
        replace: true
      });

    } catch (error) {
      console.error("Request submission error:", error);

      if (error.code === "permission-denied") {
        setSubmitError(
          "Access denied. Please make sure your student account is approved."
        );
      } else if (error.code === "unavailable") {
        setSubmitError(
          "Unable to connect to Firebase. Please check your internet connection."
        );
      } else {
        setSubmitError(
          "Something went wrong. Please try submitting your request again."
        );
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="request-page">

      {/* Page heading */}
      <div className="request-header">
        <Link to="/services" className="back-link">
          ← Back to Services
        </Link>

        <span className="section-label">
          STUDENT SERVICES
        </span>

        <h1>Submit a Service Request</h1>
      </div>

      <div className="request-container">
        <form
          className="request-form"
          onSubmit={handleSubmit}
          noValidate
        >

          {/* Student details */}
          <div className="form-heading">
            <h2>Student Information</h2>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="studentName">
                Full Name *
              </label>

              <input
                id="studentName"
                type="text"
                value={studentName}
                readOnly
                title="Registered student name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="studentId">
                Student ID *
              </label>

              <input
                id="studentId"
                type="text"
                value={studentId}
                readOnly
                title="Registered student ID"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">
              Email Address *
            </label>

            <input
              id="email"
              type="email"
              value={email}
              readOnly
              title="Verified email address"
            />
          </div>

          {!accountReady && (
            <p className="error-text" role="alert">
              Your student profile is unavailable.
              Please sign in again or contact the administrator.
            </p>
          )}

          {/* Request information */}
          <div className="form-heading second-heading">
            <h2>Request Details</h2>
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
                className={errors.serviceId ? "input-error" : ""}
                aria-invalid={Boolean(errors.serviceId)}
              >
                <option value="">Select a service</option>

                {services.map((service) => (
                  <option
                    key={service.id}
                    value={String(service.id)}
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
                value={formData.requestDate}
                readOnly
              />
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
              maxLength={5000}
              placeholder="Explain why you need this service..."
              value={formData.description}
              onChange={handleChange}
              onBlur={handleBlur}
              className={errors.description ? "input-error" : ""}
              aria-invalid={Boolean(errors.description)}
            />

            <small
              style={{
                display: "block",
                textAlign: "right",
                marginTop: "5px",
                opacity: 0.7
              }}
            >
              {formData.description.length}/5000
            </small>

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

          {/* Form buttons */}
          <div className="form-actions">
            <Link to="/services" className="cancel-btn">
              Cancel
            </Link>

            <button
              type="submit"
              className="submit-btn"
              disabled={loading || !accountReady}
            >
              {loading ? "Submitting..." : "Submit Request →"}
            </button>
          </div>

        </form>
      </div>
    </main>
  );
}

export default RequestForm;
