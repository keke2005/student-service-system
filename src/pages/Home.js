
import React from "react";
import { Link } from "react-router-dom";
import ServiceCard from "../components/ServiceCard";
import { services } from "../data/services";

export default function Home() {
  return (
    <div className="home-page">

      {/* HERO SECTION */}
      <section className="hero">

        <div className="hero-content">
          <span className="hero-label">
            WELCOME TO YOUR STUDENT PORTAL
          </span>

          <h1>
            Your Campus Services,
            <br />
            <span>Made Simple.</span>
          </h1>

          <p>
            Need help with something at campus? We have
            made it easier for you to access student
            services in one place. Request your academic
            documents, get registration assistance, or
            report technical problems without having to
            visit different offices.
          </p>

          <div className="hero-buttons">
            <Link to="/services" className="primary-btn">
              Explore Services →
            </Link>

            <Link to="/requests" className="secondary-btn">
              My Requests
            </Link>
          </div>

          <div className="hero-stats">
            <div>
              <h2>6</h2>
              <p>Student Services</p>
            </div>

            <div>
              <h2>24/7</h2>
              <p>Online Access</p>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="hero-visual">
          <div className="visual-card">

            <div className="visual-icon">🎓</div>

            <h2>Student Service Portal</h2>

            <p>
              Making it easier for students to get the
              help and support they need.
            </p>

            <div className="visual-item">
              <span>📄</span>
              <div>
                <strong>Academic Documents</strong>
                <small>
                  Get your transcripts and official letters.
                </small>
              </div>
            </div>

            <div className="visual-item">
              <span>🪪</span>
              <div>
                <strong>Student Assistance</strong>
                <small>
                  Need help with registration or your student ID?
                </small>
              </div>
            </div>

            <div className="visual-item">
              <span>💻</span>
              <div>
                <strong>Technical Support</strong>
                <small>
                  Having technical problems? We're here to help.
                </small>
              </div>
            </div>

          </div>
        </div>

      </section>

      {/* SERVICES SECTION */}
      <section className="services-section">

        <div className="section-heading">
          <span className="section-label">
            HOW WE CAN HELP
          </span>

          <h2>Services for Students</h2>

          <p>
            From academic documents to technical support,
            find the services you need to make your
            student life easier.
          </p>
        </div>

        <div className="services-grid">
          {services.slice(0, 3).map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
            />
          ))}
        </div>

        <div className="section-action">
          <Link to="/services" className="primary-btn">
            View All Services →
          </Link>
        </div>

      </section>

      {/* HELP SECTION */}
      <section className="cta-section">

        <span className="section-label">
          WE'RE HERE FOR YOU
        </span>

        <h2>How Can We Help You Today?</h2>

        <p>
          Whether you need a transcript, help with
          registration, or assistance with a technical
          issue, simply submit a request through our
          portal. You can also check the progress
          of your request whenever you need to.
        </p>

        <Link to="/services" className="cta-btn">
          Submit a Request →
        </Link>

      </section>

    </div>
  );
}
