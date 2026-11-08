
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
            Access university services in one place.
            Request academic documents, get help with
            registration or technical issues, and keep
            track of your requests online.
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

        {/* STUDENT SERVICES CARD */}
        <div className="hero-visual">
          <div className="visual-card">

            <div className="visual-icon">🎓</div>

            <h2>Student Service Portal</h2>

            <p>
              Everything you need for student support,
              all in one place.
            </p>

            <div className="visual-item">
              <span>📄</span>
              <div>
                <strong>Academic Documents</strong>
                <small>
                  Request transcripts and letters
                </small>
              </div>
            </div>

            <div className="visual-item">
              <span>🪪</span>
              <div>
                <strong>Student Assistance</strong>
                <small>
                  Registration and student ID support
                </small>
              </div>
            </div>

            <div className="visual-item">
              <span>💻</span>
              <div>
                <strong>Technical Support</strong>
                <small>
                  Get help with technical issues
                </small>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* AVAILABLE SERVICES */}
      <section className="services-section">

        <div className="section-heading">
          <span className="section-label">
            WHAT WE OFFER
          </span>

          <h2>Our Student Services</h2>

          <p>
            Find the support you need for your
            academic and campus activities.
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
          NEED ASSISTANCE?
        </span>

        <h2>We're Here to Help</h2>

        <p>
          Need an academic document, registration help,
          or technical support? Submit your request
          online and check its progress.
        </p>

        <Link to="/services" className="cta-btn">
          Get Started →
        </Link>

      </section>

    </div>
  );
}
