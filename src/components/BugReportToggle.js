import React, { useState, useEffect, useCallback } from "react";
import { toggleBugReporting, getBugReportingStatus } from "../utils/analytics";
import { FaBug } from "react-icons/fa";

const BugReportToggle = ({ className = "" }) => {
  const [isEnabled, setIsEnabled] = useState(getBugReportingStatus());
  const [showTooltip, setShowTooltip] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleToggle = useCallback(() => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    toggleBugReporting(newState);
  }, [isEnabled]);

  useEffect(() => {
    let timeoutId;
    if (isHovered) {
      setShowTooltip(true);
    } else {
      // Add a small delay before hiding the tooltip
      timeoutId = setTimeout(() => {
        setShowTooltip(false);
      }, 100);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isHovered]);

  return (
    <div className={`relative ${className}`}>
      <style>
        {`
          @keyframes crawl {
            0% { transform: translate(0, 0) rotate(0deg); }
            25% { transform: translate(1px, 1px) rotate(5deg); }
            50% { transform: translate(0, 2px) rotate(0deg); }
            75% { transform: translate(-1px, 1px) rotate(-5deg); }
            100% { transform: translate(0, 0) rotate(0deg); }
          }
          .bug-crawl {
            animation: crawl 1s ease-in-out infinite;
            transform-origin: center;
            display: inline-block;
          }
        `}
      </style>
      <button
        onClick={handleToggle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`flex items-center px-3 py-1 rounded-md transition-colors duration-200 ${
          isEnabled
            ? "text-red-600 hover:text-red-700"
            : "text-gray-400 hover:text-gray-500"
        }`}
        aria-label="Toggle bug reporting"
      >
        <div className={isEnabled ? "bug-crawl" : ""}>
          <FaBug className="text-sm" />
        </div>
      </button>

      {showTooltip && (
        <div
          className="absolute z-50 w-64 p-2 text-xs text-white bg-gray-800 rounded-md -left-24 -bottom-20"
          style={{ lineHeight: "1.4" }}
        >
          <div className="font-medium mb-1">
            {isEnabled ? "Bug Reporting Enabled" : "Bug Reporting Disabled"}
          </div>
          <div>
            {isEnabled
              ? "Page content and tool data will be included in analytics to help diagnose issues."
              : "Basic session metrics only. Tool data and content will be masked for privacy."}
          </div>
        </div>
      )}
    </div>
  );
};

export default BugReportToggle;
