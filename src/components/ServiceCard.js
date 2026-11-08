
import React from "react";
import { Link } from "react-router-dom";

export default function ServiceCard({ service }) {
  return (
    <div className="service-card">
      <div className="service-icon">{service.icon}</div>

      <h3>{service.name}</h3>
      <p>{service.description}</p>

      <div className="service-info">
        <span>Department</span>
        <strong>{service.department}</strong>
      </div>

      <div className="service-info">
        <span>Processing Time</span>
        <strong>{service.processingTime}</strong>
      </div>

      <Link
        to={`/services/${service.id}`}
        className="service-link"
      >
        View Service →
      </Link>
    </div>
  );
}
