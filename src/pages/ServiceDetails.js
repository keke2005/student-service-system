
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
      <div className="not-found">
        <h1>Service Not Found</h1>
        <p>The selected service does not exist.</p>

        <Link to="/services" className="primary-btn">
          Back to Services
        </Link>
      </div>
    );
  }

  const steps = [
    "Select the service you need.",
    "Complete the online request form.",
    "Submit your request for processing.",
    "Check the status of your request."
  ];

  return (
    <main className="details-page">

      {/* PAGE HEADER */}
      <div className="details-header">

        <Link to="/services" className="back-link">
          ← Back to Services
        </Link>

        <span className="section-label">
          STUDENT SERVICES
        </span>

        <h1>{service.name}</h1>

        <p>
          Find out more about this service and submit
          your request online.
        </p>

      </div>

      {/* DETAILS CONTENT */}
      <div className="details-container">

        {/* MAIN SECTION */}
        <section className="details-main">

          <div className="service-overview-heading">

            <div className="details-icon">
              {service.icon}
            </div>

            <div>
              <span className="section-label">
                ABOUT THIS SERVICE
              </span>

              <h2>Service Overview</h2>
            </div>

          </div>

          <p className="overview-description">
            {service.description}
          </p>

          <div className="details-divider"></div>

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

        </section>

        {/* SIDEBAR */}
        <aside className="details-sidebar">

          <h3>Service Information</h3>

          <p className="sidebar-description">
            Important information about this
            university service.
          </p>

          {/* REUSABLE COMPONENT WITH PROPS */}
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

          <Link
            to={`/request/${service.id}`}
            className="request-btn"
          >
            Request This Service →
          </Link>

          <p className="sidebar-note">
            Please provide accurate information
            when submitting your request.
          </p>

        </aside>

      </div>

    </main>
  );
}

export default ServiceDetails;
