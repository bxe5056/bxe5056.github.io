import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import { navLinks } from "../../utils/constants";
import posthog from "../../utils/analytics";

const NavBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { scrollY, scrollYProgress } = useScroll({
    offset: ["start start", "end end"],
    container: typeof window !== "undefined" ? window : undefined,
    axis: "y",
  });

  const isHomePage = location.pathname === "/";

  // Enhanced scroll animations with adjusted thresholds
  const headerHeight = useTransform(scrollY, [0, 50], ["4rem", "3.5rem"]);
  const backgroundColor = useTransform(
    scrollY,
    [0, 50],
    isHomePage
      ? ["rgba(15, 23, 42, 0.6)", "rgba(15, 23, 42, 0.85)"]
      : ["rgba(249, 250, 251, 0)", "rgba(71, 85, 105, 0.75)"]
  );

  const backdropBlur = useTransform(
    scrollY,
    [0, 50],
    ["blur(10px)", "blur(16px)"]
  );

  const boxShadow = useTransform(
    scrollY,
    [0, 50],
    isHomePage
      ? [
          "0 4px 24px -4px rgba(0, 0, 0, 0.1)",
          "0 8px 32px -8px rgba(0, 0, 0, 0.3)",
        ]
      : [
          "0 0 0 0 rgba(51, 65, 85, 0)",
          "0 8px 32px -8px rgba(51, 65, 85, 0.15)",
        ]
  );

  const borderOpacity = useTransform(scrollY, [0, 50], ["0.08", "0.15"]);

  // Keep the logo gradient with primary theme colors
  const logoColor = useTransform(
    scrollY,
    [0, 50],
    isHomePage
      ? [
          "linear-gradient(to right, rgb(255, 255, 255), rgb(219, 234, 254))",
          "linear-gradient(to right, rgb(255, 255, 255), rgb(219, 234, 254))",
        ]
      : [
          "linear-gradient(to right, rgb(37, 99, 235), rgb(59, 130, 246))",
          "linear-gradient(to right, rgb(255, 255, 255), rgb(219, 234, 254))",
        ]
  );

  const textColorActive = useTransform(
    scrollY,
    [0, 50],
    isHomePage
      ? ["rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 1)"]
      : ["rgba(31, 41, 55, 1)", "rgba(255, 255, 255, 1)"]
  );

  const textColorInactive = useTransform(
    scrollY,
    [0, 50],
    isHomePage
      ? ["rgba(255, 255, 255, 0.8)", "rgba(255, 255, 255, 0.8)"]
      : ["rgba(55, 65, 81, 0.9)", "rgba(241, 245, 249, 1)"]
  );

  const socialIconColor = useTransform(
    scrollY,
    [0, 50],
    isHomePage
      ? ["rgba(255, 255, 255, 0.8)", "rgba(255, 255, 255, 0.8)"]
      : ["rgba(55, 65, 81, 0.9)", "rgba(241, 245, 249, 1)"]
  );

  const textColor = useTransform(
    scrollY,
    [0, 50],
    isHomePage
      ? ["rgb(255, 255, 255)", "rgb(255, 255, 255)"]
      : ["rgb(31, 41, 55)", "rgb(255, 255, 255)"]
  );

  const underlineGradient = useTransform(
    scrollY,
    [0, 50],
    isHomePage
      ? [
          "linear-gradient(to right, rgb(255, 255, 255), rgb(255, 255, 255))",
          "linear-gradient(to right, rgb(255, 255, 255), rgb(255, 255, 255))",
        ]
      : [
          "linear-gradient(to right, rgb(37, 99, 235), rgb(59, 130, 246))",
          "linear-gradient(to right, rgb(255, 255, 255), rgb(255, 255, 255))",
        ]
  );

  const isActive = (path) => location.pathname === path;

  const handleNavClick = (path, title) => {
    posthog.capture("navigation_click", {
      path: path,
      title: title,
    });
    setIsMenuOpen(false);
  };

  return (
    <motion.header
      style={{
        height: headerHeight,
        backgroundColor,
        backdropFilter: backdropBlur,
        boxShadow,
        borderBottom: `1px solid rgba(51, 65, 85, ${borderOpacity.get()})`,
      }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <div className="container mx-auto h-full px-4">
        <nav className="flex items-center justify-between h-full">
          {/* Logo */}
          <Link
            to="/"
            className="relative group flex-shrink-0 mr-4"
            onClick={() => handleNavClick("/", "Home")}
          >
            <motion.div
              className="flex items-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <img
                src="/images/avatar.webp"
                alt="Benjamin Eppinger"
                className="h-14 w-14 object-cover object-[center_-1.5%]"
              />
              <motion.span
                className="ml-3 text-lg font-semibold sm:hidden md:inline"
                style={{
                  color: textColor,
                }}
              >
                BenTheITGuy
              </motion.span>
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center flex-grow justify-end">
            <div className="flex items-center justify-end space-x-2 md:space-x-3 lg:space-x-6">
              {navLinks.map(({ title, path }) => (
                <motion.div
                  key={path}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    color: isActive(path) ? textColorActive : textColorInactive,
                  }}
                  className="relative group text-sm font-medium transition-colors whitespace-nowrap"
                >
                  <Link
                    to={path}
                    style={{
                      color: "inherit",
                    }}
                    className="block px-1 md:px-2 lg:px-3 py-2 rounded-md text-sm font-medium transition-colors hover:text-primary-600"
                    onClick={() => handleNavClick(path, title)}
                  >
                    {title}
                  </Link>
                  <motion.span
                    className="absolute -bottom-1 left-0 w-full h-0.5 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"
                    style={{
                      backgroundImage: underlineGradient,
                    }}
                  />
                </motion.div>
              ))}
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-4 pl-1.5 sm:pl-2 lg:pl-4 ml-1.5 sm:ml-2 lg:ml-4 border-l border-gray-200/50">
              <motion.a
                href="https://github.com/bxe5056"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                style={{ color: socialIconColor }}
                className="hover:text-primary-600 transition-colors"
              >
                <FaGithub className="text-xl" />
              </motion.a>
              <motion.a
                href="https://www.linkedin.com/in/benjamindeppingerpsu"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                style={{ color: socialIconColor }}
                className="hover:text-primary-600 transition-colors"
              >
                <FaLinkedin className="text-xl" />
              </motion.a>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            style={{ color: textColorInactive }}
            className="md:hidden relative w-10 h-10 flex items-center justify-center rounded-lg bg-gray-50/50 backdrop-blur-sm hover:bg-gray-100 transition-all"
            whileTap={{ scale: 0.95 }}
            aria-label="Toggle menu"
          >
            <div className="w-6 h-5 flex flex-col justify-between items-center">
              <motion.span
                className="w-6 h-[2px] rounded-full origin-right"
                style={{ backgroundColor: textColorInactive }}
                animate={{
                  rotate: isMenuOpen ? 45 : 0,
                  y: isMenuOpen ? 8 : 0,
                  width: isMenuOpen ? 24 : 24,
                }}
              />
              <motion.span
                className="w-5 h-[2px] rounded-full"
                style={{ backgroundColor: textColorInactive }}
                animate={{
                  width: isMenuOpen ? 0 : 20,
                  opacity: isMenuOpen ? 0 : 1,
                }}
              />
              <motion.span
                className="w-6 h-[2px] rounded-full origin-right"
                style={{ backgroundColor: textColorInactive }}
                animate={{
                  rotate: isMenuOpen ? -45 : 0,
                  y: isMenuOpen ? -8 : 0,
                  width: isMenuOpen ? 24 : 24,
                }}
              />
            </div>
          </motion.button>
        </nav>

        {/* Progress Bar */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-[1px] bg-primary-600 origin-left"
          style={{ scaleX: scrollYProgress }}
        />
      </div>

      {/* Mobile Menu */}
      <motion.div
        className="md:hidden bg-white/95 backdrop-blur-sm border-t border-gray-100 overflow-hidden"
        animate={{
          height: isMenuOpen ? "auto" : 0,
          opacity: isMenuOpen ? 1 : 0,
          pointerEvents: isMenuOpen ? "auto" : "none",
        }}
        transition={{ duration: 0.2, ease: [0.04, 0.62, 0.23, 0.98] }}
      >
        <div className="container mx-auto px-4 py-3 space-y-1">
          {navLinks.map(({ title, path }) => (
            <motion.div key={path} whileTap={{ scale: 0.98 }}>
              <Link
                to={path}
                className={`block py-2.5 px-4 rounded-lg text-sm transition-colors ${
                  isActive(path)
                    ? "bg-primary-50/80 text-primary-600 font-medium"
                    : "text-gray-600 hover:bg-gray-50/80"
                }`}
                onClick={() => handleNavClick(path, title)}
              >
                {title}
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.header>
  );
};

export default NavBar;
