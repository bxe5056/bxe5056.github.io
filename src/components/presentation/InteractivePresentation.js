import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/outline';

const InteractivePresentation = ({ isOpen, onClose }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const slides = [
    {
      id: 1,
      title: "Cross-Platform Mobile Excellence",
      subtitle: "React + Ionic Fleet Management App",
      content: {
        achievement: "Built mission-critical cross-platform app with React + Ionic, Zustand state management, and advanced mapping",
        impact: "Real-time fleet tracking with 3D Mapbox GL JS on web and PigeonMaps on mobile - serving hundreds of autonomous mowers",
        technologies: ["React", "Ionic", "TypeScript", "Zustand", "Mapbox GL JS", "PigeonMaps", "GraphQL"],
        metrics: [
          "Cross-platform compatibility (iOS/Android/Web)",
          "3D mapping with real-time updates",
          "Hundreds of active fleet vehicles",
          "App Store & Play Store live"
        ],
        relevance: "Direct experience with fleet management systems and cross-platform React development - exactly what's needed for robot fleet portal development"
      },
      visual: "mobile-excellence",
      color: "from-blue-600 to-blue-800"
    },
    {
      id: 2,
      title: "Authentication Innovation",
      subtitle: "Phone-Based Login with Stytch",
      content: {
        achievement: "🔐 When standard login flows don't work, you build one that does. Implemented passwordless phone-based authentication for field workers without email addresses",
        impact: "Designed reliable, branded login experience using Stytch's OTP system - solving real-world UX challenges where traditional auth fails",
        technologies: ["Stytch", "React", "Phone OTP", "Passwordless Auth", "Branding", "UX Design"],
        metrics: [
          "Zero-friction login for field workers",
          "No email requirement",
          "Custom branded experience",
          "Lightning-fast implementation"
        ],
        relevance: "Proven ability to solve complex authentication challenges and build user-centric solutions - essential for diverse user base management"
      },
      visual: "auth-innovation",
      color: "from-green-600 to-green-800"
    },
    {
      id: 3,
      title: "Real-Time Communication",
      subtitle: "Push Notifications & Background Sync",
      content: {
        achievement: "📱 Built robust push notification system with Knock and background sync for field operations",
        impact: "Enabled real-time communication and data synchronization for teams working in remote locations with unreliable connectivity",
        technologies: ["Knock", "Push Notifications", "Background Sync", "React Native", "Offline-First"],
        metrics: [
          "Reliable push notifications",
          "Background data sync",
          "Offline-first architecture",
          "Field team connectivity"
        ],
        relevance: "Experience with real-time systems and offline-first architecture - critical for robotics operations in various environments"
      },
      visual: "real-time-comm",
      color: "from-purple-600 to-purple-800"
    },
    {
      id: 4,
      title: "User-Centric Problem Solving",
      subtitle: "Zone Pancaking & UX Innovation",
      content: {
        achievement: "Solved complex UX challenges like 'zone pancaking' where customers create overlapping zones instead of using existing ones",
        impact: "Identified and resolved user workflow issues that were causing confusion and inefficiency in field operations",
        technologies: ["UX Research", "Problem Solving", "User Testing", "Workflow Analysis"],
        metrics: [
          "Complex UX problem identified",
          "User workflow improvements",
          "Field operation efficiency gains",
          "Customer satisfaction increase"
        ],
        relevance: "Proven ability to identify and solve complex UX problems - essential for user-facing robotics interfaces"
      },
      visual: "problem-solving",
      color: "from-orange-600 to-orange-800"
    },
    {
      id: 5,
      title: "Developer Tools Suite",
      subtitle: "Portfolio Website & Community Tools",
      content: {
        achievement: "Built comprehensive suite of developer tools including color conversion, SVG optimization, PDF manipulation, and data processing utilities",
        impact: "Created valuable tools for the development community while showcasing technical versatility and attention to developer experience",
        technologies: ["React", "JavaScript", "CSS", "SVG", "PDF.js", "Canvas API", "File Processing"],
        metrics: [
          "10+ specialized tools created",
          "Open source contributions",
          "Developer community value",
          "Technical versatility demonstrated"
        ],
        relevance: "Demonstrates technical depth, community contribution, and the kind of innovative tool-building mindset that benefits development processes"
      },
      visual: "dev-tools",
      color: "from-indigo-600 to-indigo-800"
    }
  ];

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const goToSlide = useCallback((index) => {
    setCurrentSlide(index);
  }, []);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'ArrowRight':
        case ' ':
          e.preventDefault();
          nextSlide();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          prevSlide();
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case 'F11':
          e.preventDefault();
          toggleFullscreen();
          break;
        default:
          // No action needed for other keys
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, nextSlide, prevSlide, toggleFullscreen]);

  if (!isOpen) return null;

  const currentSlideData = slides[currentSlide];

  return (
    <div className={`fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4 ${isFullscreen ? 'p-0' : ''}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={`bg-white rounded-lg shadow-2xl overflow-hidden ${isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-6xl h-[90vh]'}`}
      >
        {/* Header */}
        <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold">Portfolio Presentation</h2>
            <span className="text-sm text-gray-300">
              Slide {currentSlide + 1} of {slides.length}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-gray-700 rounded transition-colors"
              title="Toggle Fullscreen (F11)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Slide Content */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -300 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="h-full flex"
            >
              {/* Left Side - Content */}
              <div className="flex-1 p-8 flex flex-col justify-center">
                <div className="">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className={`inline-block px-4 py-2 rounded-full text-sm font-medium text-white bg-gradient-to-r ${currentSlideData.color} mb-4`}
                  >
                    {currentSlideData.subtitle}
                  </motion.div>
                  
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-4xl font-bold text-gray-900 mb-6"
                  >
                    {currentSlideData.title}
                  </motion.h1>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="space-y-6"
                  >
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Achievement</h3>
                      <p className="text-gray-700">{currentSlideData.content.achievement}</p>
                    </div>

                    <div className="bg-blue-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Impact</h3>
                      <p className="text-gray-700">{currentSlideData.content.impact}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Technologies</h3>
                        <div className="flex flex-wrap gap-2">
                          {currentSlideData.content.technologies.map((tech, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Metrics</h3>
                        <ul className="space-y-1">
                          {currentSlideData.content.metrics.map((metric, index) => (
                            <li key={index} className="text-gray-700 text-sm flex items-center">
                              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                              {metric}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="bg-green-50 border-l-4 border-green-500 p-4">
                      <h3 className="text-lg font-semibold text-green-800 mb-2">Why This Matters</h3>
                      <p className="text-green-700">{currentSlideData.content.relevance}</p>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Right Side - Visual */}
              <div className="w-1/3 bg-gradient-to-br from-gray-100 to-gray-200 p-8 flex items-center justify-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-center"
                >
                  <div className={`w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-r ${currentSlideData.color} flex items-center justify-center`}>
                    <span className="text-4xl font-bold text-white">
                      {currentSlideData.id}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {currentSlideData.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {currentSlideData.subtitle}
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="bg-gray-100 p-4 flex justify-between items-center">
          <button
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            <span>Previous</span>
          </button>

          {/* Slide Indicators */}
          <div className="flex space-x-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentSlide ? 'bg-blue-600' : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>

          <button
            onClick={nextSlide}
            disabled={currentSlide === slides.length - 1}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
          >
            <span>Next</span>
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Instructions */}
        <div className="bg-gray-900 text-white p-2 text-center text-sm">
          Use arrow keys or spacebar to navigate • Press F11 for fullscreen • Press Esc to close
        </div>
      </motion.div>
    </div>
  );
};

export default InteractivePresentation;
