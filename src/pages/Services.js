
import React from "react";
import { Link } from "react-router-dom";
import ServiceCard from "../components/ServiceCard";
import { services } from "../data/services";

export default function Services() {
  return (
    <main className="services-page">
      <div className="services-page-header">
        <div>
          <span className="section-label">
            LIMKOKWING UNIVERSITY
          </span>

          <h1>Student Services</h1>

          <p>
            Browse the available university services.
            Select a service to view its requirements,
            processing time and department before
            submitting your request.
          </p>
        </div>

        <Link
          to="/requests"
          className="secondary-btn"
        >
          My Requests
        </Link>
      </div>

      <section className="services-directory">
        <div className="services-directory-heading">
          <div>
            <h2>Available Services</h2>
            <p>
              {services.length} services available
            </p>
          </div>
        </div>

        <div className="services-grid">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
            />
          ))}
        </div>
      </section>

      <div className="services-page-footer">
        <p>
          Need to check a request you already submitted?
        </p>

        <Link to="/requests">
          View My Requests →
        </Link>
      </div>
    </main>
  );
}
