
import React from "react";
import ServiceCard from "../components/ServiceCard";
import { services } from "../data/services";

export default function Services() {
  return (
    <div className="services-page">
      <div className="page-heading">
        <span className="section-label">
          STUDENT SUPPORT
        </span>

        <h1>Our Services</h1>

        <p>
          Browse available university services and
          choose the assistance you need.
        </p>
      </div>

      <div className="services-grid">
        {services.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
          />
        ))}
      </div>
    </div>
  );
}
