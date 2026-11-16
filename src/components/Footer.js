
import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand">
          <h2>StudentServe</h2>
          <p>Limkokwing University of Creative Technology</p>
          <p>Maseru, Lesotho (Main Campus and MP Campus)</p>
        </div>

        <div className="footer-links">
          <h3>Quick Links</h3>
          <div className="footer-nav">
            <Link to="/home">Home</Link>
            <Link to="/services">Services</Link>
            <Link to="/requests">My Requests</Link>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>
          © {new Date().getFullYear()} StudentServe.
          All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}
