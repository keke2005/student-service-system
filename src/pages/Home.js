
import React from "react";
import { Link } from "react-router-dom";
import ServiceCard from "../components/ServiceCard";
import { services } from "../data/services";

export default function Home() {
  return (
    <main className="home-page">
      <section className="home-intro">
        <div className="home-intro-content">
          <span className="home-eyebrow">
            LIMKOKWING UNIVERSITY
          </span>

          <h1>Student Service Request System</h1>

          <p>
            Welcome to StudentServe. You can request
            academic documents, get registration
            assistance, report technical problems and
            submit general enquiries online.
          </p>

          <div className="home-intro-actions">
            <Link to="/services" className="primary-btn">
              Browse Services
            </Link>

            <Link to="/requests" className="secondary-btn">
              My Requests
            </Link>
          </div>
        </div>

        <div className="home-intro-panel">
          <h2>Student Services</h2>
          <p>
            Find the service you need and submit your
            request without visiting multiple offices.
          </p>

          <div className="home-intro-summary">
            <div>
              <strong>{services.length}</strong>
              <span>Available Services</span>
            </div>

            <div>
              <strong>Online</strong>
              <span>Request Submission</span>
            </div>
          </div>
        </div>
      </section>

      <section className="home-services">
        <div className="home-section-heading">
          <div>
            <span className="home-eyebrow">
              STUDENT SERVICES
            </span>

            <h2>Available Services</h2>

            <p>
              Select a service to view its details,
              processing time and responsible department.
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

      <section className="home-process">
        <div className="home-section-heading">
          <span className="home-eyebrow">
            REQUEST PROCESS
          </span>

          <h2>How It Works</h2>

          <p>
            Submit and manage your university service
            requests in three steps.
          </p>
        </div>

        <div className="home-process-grid">
          <div className="home-process-step">
            <span className="home-step-number">01</span>
            <h3>Choose a Service</h3>
            <p>
              Browse the available services and select
              the one you need.
            </p>
          </div>

          <div className="home-process-step">
            <span className="home-step-number">02</span>
            <h3>Submit Your Request</h3>
            <p>
              Complete the request form with your
              information and reason for requesting.
            </p>
          </div>

          <div className="home-process-step">
            <span className="home-step-number">03</span>
            <h3>Track Your Request</h3>
            <p>
              Open My Requests to view your submitted
              requests and their current status.
            </p>
          </div>
        </div>

        <div className="home-process-actions">
          <Link to="/requests" className="primary-btn">
            View My Requests
          </Link>
        </div>
      </section>
    </main>
  );
}
