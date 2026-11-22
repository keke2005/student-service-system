
import React from "react";
import { Link } from "react-router-dom";
import ServiceCard from "../components/ServiceCard";
import { services } from "../data/services";

export default function Home() {
  const featuredServices = services.slice(0, 3);

  return (
    <main className="home-page">

      {/* HERO SECTION */}
      <section className="hero">
        <div className="hero-content">

          <span className="hero-label">
            STUDENT SERVICE PORTAL
          </span>

          <h1>
            Student Services,
            <br />
            <span>Made Simple.</span>
          </h1>

          <p>
            Access university services, submit requests,
            and track their progress — all in one place.
          </p>

          <div className="hero-buttons">
            <Link
              to="/services"
              className="primary-btn"
            >
              Explore Services
              <span aria-hidden="true"> →</span>
            </Link>

            <Link
              to="/requests"
              className="secondary-btn"
            >
              My Requests
            </Link>
          </div>

          <div className="hero-stats">
            <div>
              <h2>{services.length}</h2>
              <p>Student Services</p>
            </div>

            <div>
              <h2>24/7</h2>
              <p>Online Access</p>
            </div>
          </div>

        </div>

        {/* HERO INFORMATION CARD */}
        <div className="hero-visual">
          <div className="visual-card">

            <div className="visual-card-header">
              <div className="visual-icon">
                🎓
              </div>

              <div>
                <span className="visual-eyebrow">
                  STUDENTSERVE
                </span>
                <h2>How Can We Help?</h2>
              </div>
            </div>

            <div className="visual-item">
              <span className="visual-item-icon">
                📄
              </span>

              <div>
                <strong>Academic Documents</strong>
                <small>
                  Transcripts and official letters
                </small>
              </div>
            </div>

            <div className="visual-item">
              <span className="visual-item-icon">
                🪪
              </span>

              <div>
                <strong>Student Assistance</strong>
                <small>
                  Registration and student ID support
                </small>
              </div>
            </div>

            <div className="visual-item">
              <span className="visual-item-icon">
                💻
              </span>

              <div>
                <strong>Technical Support</strong>
                <small>
                  Help with technical issues
                </small>
              </div>
            </div>

            <Link
              to="/services"
              className="visual-card-link"
            >
              Browse Services
              <span aria-hidden="true"> →</span>
            </Link>

          </div>
        </div>
      </section>

      {/* FEATURED SERVICES */}
      <section className="services-section">

        <div className="section-heading">
          <div>
            <span className="section-label">
              OUR SERVICES
            </span>

            <h2>Services for Students</h2>
          </div>

          <Link
            to="/services"
            className="home-view-all"
          >
            View All Services
            <span aria-hidden="true"> →</span>
          </Link>
        </div>

        <div className="services-grid">
          {featuredServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
            />
          ))}
        </div>

        <div className="section-action">
          <Link
            to="/services"
            className="primary-btn"
          >
            Explore All Services →
          </Link>
        </div>

      </section>

      {/* FINAL ACTION */}
      <section className="cta-section">
        <div className="home-cta-content">
          <div>
            <span className="section-label">
              NEED ASSISTANCE?
            </span>

            <h2>We're Here to Help</h2>

            <p>
              Submit a service request and track
              its progress online.
            </p>
          </div>

          <Link
            to="/services"
            className="cta-btn"
          >
            Submit a Request →
          </Link>
        </div>
      </section>

    </main>
  );
}
