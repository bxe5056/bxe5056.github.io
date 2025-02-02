import React from "react";
import { Link } from "react-router-dom";
import {
  FaGithub,
  FaLinkedin,
  FaEnvelope,
  FaMapMarkerAlt,
  FaPhone,
} from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-gray-900">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-12">
          {/* Brand & Description */}
          <div>
            <Link
              to="/"
              className="text-2xl font-bold font-montserrat text-white mb-4 block"
            >
              Benjamin Eppinger
            </Link>
            <p className="text-gray-400 mb-6">
              Full-stack developer passionate about creating intuitive and
              scalable web applications with modern technologies.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <div className="space-y-2">
              <Link
                to="/about"
                className="block text-gray-400 hover:text-primary-400 transition-colors"
              >
                About
              </Link>
              <Link
                to="/portfolio"
                className="block text-gray-400 hover:text-primary-400 transition-colors"
              >
                Portfolio
              </Link>
              <Link
                to="/experience"
                className="block text-gray-400 hover:text-primary-400 transition-colors"
              >
                Experience
              </Link>
              <Link
                to="/resume"
                className="block text-gray-400 hover:text-primary-400 transition-colors"
              >
                Resume
              </Link>
              <Link
                to="/tools"
                className="block text-gray-400 hover:text-primary-400 transition-colors"
              >
                Tools
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-400">
                <FaMapMarkerAlt className="text-primary-400" />
                <span>Greater Denver Area, CO</span>
              </div>
              <a
                href="tel:+18143108292"
                className="flex items-center gap-2 text-gray-400 hover:text-primary-400 transition-colors"
              >
                <FaPhone />
                (814) 310-8292
              </a>
              <a
                href="mailto:bxe5056@gmail.com"
                className="flex items-center gap-2 text-gray-400 hover:text-primary-400 transition-colors"
              >
                <FaEnvelope />
                bxe5056@gmail.com
              </a>
              <div className="flex gap-4 pt-2">
                <a
                  href="https://github.com/bxe5056"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-primary-400 transition-colors"
                >
                  <FaGithub className="text-xl" />
                </a>
                <a
                  href="https://www.linkedin.com/in/benjamindeppingerpsu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-primary-400 transition-colors"
                >
                  <FaLinkedin className="text-xl" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
          <p>
            © {new Date().getFullYear()} Benjamin Eppinger. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
