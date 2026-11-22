
import React from "react";
import { Link, useParams } from "react-router-dom";
import { services } from "../data/services";
import ServiceInfo from "../components/ServiceInfo";

function ServiceDetails() {
  const { id } = useParams();

  const service = services.find(
    (item) => item.id === Number(id)
  );

  if (!service) {
    return (
      <main className="not-found">
        <h1>Service Not Found</h1>

        <p>The selected service does not exist.</p>

        <Link to="/services" className="primary-btn">
          Back to Services
        </Link>
      </main>
    );
  }

  const steps = [
    "Select your service",
    "Complete the request form",
    "Submit your request",
    "Track its status"
  ];

  return (
    <main className="details-page">

      {/* PAGE HEADER */}
      <div className="details-header">
        <Link
          to="/services"
          className="back-link"
        >
          ← Back to Services
        </Link>

        <span className="section-label">
          STUDENT SERVICES
        </span>

        <h1>{service.name}</h1>
      </div>

      {/* ONE UNIFIED CARD */}
      <section className="details-unified-card">

        <div className="details-unified-grid">

          {/* LEFT: SERVICE OVERVIEW */}
          <div className="details-unified-overview">

            <div className="service-overview-heading">
              <div className="details-icon">
                {service.icon}
              </div>

              <h2>Service Overview</h2>
            </div>

            <p className="overview-description">
              {service.description}
            </p>

            <div className="details-divider" />

            <h3 className="process-title">
              How It Works
            </h3>

            <div className="process-list">
              {steps.map((step, index) => (
                <div
                  className="process-step"
                  key={index}
                >
                  <span className="step-number">
                    {index + 1}
                  </span>

                  <p>{step}</p>
                </div>
              ))}
            </div>

          </div>

          {/* RIGHT: SERVICE INFORMATION */}
          <div className="details-unified-info">

            <h3>Service Information</h3>

            <div className="details-info-list">

              <ServiceInfo
                label="Department"
                value={service.department}
              />

              <ServiceInfo
                label="Processing Time"
                value={service.processingTime}
              />

              <ServiceInfo
                label="Availability"
                value="Online Request"
              />

            </div>

            <Link
              to={`/request/${service.id}`}
              className="request-btn"
            >
              Request This Service
              <span aria-hidden="true">→</span>
            </Link>

          </div>

        </div>

      </section>

    </main>
  );
}

export default ServiceDetails;
