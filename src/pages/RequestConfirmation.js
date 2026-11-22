
import React from "react";
import { Link, Navigate, useLocation } from "react-router-dom";

function RequestConfirmation() {
  const location = useLocation();
  const request = location.state?.request;

  if (!request) {
    return <Navigate to="/services" replace />;
  }

  return (
    <div className="request-page">
      <div className="request-container">
        <div className="success-message">

          <div className="success-icon">✓</div>

          <h2>Request Submitted Successfully!</h2>

          <p>
            Your request has been saved in Firebase Firestore.
            You can check its progress under My Requests.
          </p>

          <div className="confirmation-details">
            <h3>Request Details</h3>

            <p>
              <strong>Request ID:</strong> {request.id}
            </p>

            <p>
              <strong>Student Name:</strong> {request.studentName}
            </p>

            <p>
              <strong>Student ID:</strong> {request.studentId}
            </p>

            <p>
              <strong>Email:</strong> {request.email}
            </p>

            <p>
              <strong>Service:</strong> {request.serviceName}
            </p>

            <p>
              <strong>Description:</strong> {request.description}
            </p>

            <p>
              <strong>Date:</strong> {request.requestDate}
            </p>

            <p>
              <strong>Status:</strong> {request.status}
            </p>
          </div>

          <div className="form-actions">
            <Link to="/services" className="primary-btn">
              Back to Services
            </Link>

            <Link to="/requests" className="primary-btn">
              My Requests
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}

export default RequestConfirmation;
