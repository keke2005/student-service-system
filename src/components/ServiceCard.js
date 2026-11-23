
import React from "react";
import { Link } from "react-router-dom";

export default function ServiceCard({ service }) {
  return (
    <article className="service-card">
      <div className="service-card-header">
        <div className="service-icon">
          {service.icon}
        </div>

        <h3>{service.name}</h3>
      </div>

      <p className="service-description">
        {service.description}
      </p>

      <div className="service-card-details">
        <div className="service-detail-row">
          <span>Department</span>
          <strong>{service.department}</strong>
        </div>

        <div className="service-detail-row">
          <span>Processing Time</span>
          <strong>{service.processingTime}</strong>
        </div>
      </div>

      <Link
        to={`/services/${service.id}`}
        className="service-card-button"
      >
        View Details →
      </Link>
    </article>
  );
}
