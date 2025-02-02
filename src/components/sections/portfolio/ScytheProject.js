import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaGithub,
  FaAppStore,
  FaGooglePlay,
  FaChevronLeft,
  FaChevronRight,
  FaMobileAlt,
  FaTabletAlt,
} from "react-icons/fa";

const screenshots = {
  iphone: [
    {
      src: "/images/portfolio/scythe/iphone/home.png",
      alt: "iPhone - Fleet overview showing mower statuses across US",
    },
    {
      src: "/images/portfolio/scythe/iphone/mower-details.png",
      alt: "iPhone - Detailed mower status, task completion, and other details",
    },
    {
      src: "/images/portfolio/scythe/iphone/support-card.png",
      alt: "iPhone - Support card with SMS, call, and web-help support options",
    },
    {
      src: "/images/portfolio/scythe/iphone/property-viewer.png",
      alt: "iPhone - Property viewer with map and zone details",
    },
    {
      src: "/images/portfolio/scythe/iphone/zone-viewer.png",
      alt: "iPhone - Zone viewer with map and zone details",
    },
  ],
  ipad: [
    {
      src: "/images/portfolio/scythe/ipad/home-landscape.png",
      alt: "iPad - Home screen with expanded mower fleet view in landscape mode",
    },
    {
      src: "/images/portfolio/scythe/ipad/home-portrait.png",
      alt: "iPad - Home screen with expanded mower fleet view in responsive portrait mode",
    },
  ],
};

const ScytheProject = ({ disclaimer }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [deviceType, setDeviceType] = useState("iphone");
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const currentScreenshots = screenshots[deviceType];

  useEffect(() => {
    let interval;
    if (isAutoPlaying) {
      interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % currentScreenshots.length);
      }, 5000); // Change image every 5 seconds
    }
    return () => clearInterval(interval);
  }, [isAutoPlaying, currentScreenshots.length]);

  const nextSlide = () => {
    setIsAutoPlaying(false); // Pause auto-play when manually navigating
    setCurrentIndex((prev) => (prev + 1) % currentScreenshots.length);
  };

  const prevSlide = () => {
    setIsAutoPlaying(false); // Pause auto-play when manually navigating
    setCurrentIndex(
      (prev) =>
        (prev - 1 + currentScreenshots.length) % currentScreenshots.length
    );
  };

  // Resume auto-play after 10 seconds of inactivity
  useEffect(() => {
    if (!isAutoPlaying) {
      const timeout = setTimeout(() => {
        setIsAutoPlaying(true);
      }, 10000);
      return () => clearTimeout(timeout);
    }
  }, [isAutoPlaying]);

  return (
    <motion.div
      className="bg-white rounded-2xl overflow-hidden shadow-lg"
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="lg:grid lg:grid-cols-2">
        {/* Image Carousel Section */}
        <div className="relative h-[600px] lg:h-[900px] bg-gray-900">
          {/* Device Type Toggle */}
          <div className="absolute top-4 right-4 z-10 bg-gray-800/50 rounded-full p-1">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setDeviceType("iphone");
                  setCurrentIndex(0);
                }}
                className={`px-4 py-2 rounded-full flex items-center gap-2 transition-colors ${
                  deviceType === "iphone"
                    ? "bg-white text-gray-900"
                    : "text-white hover:bg-gray-700/50"
                }`}
              >
                <FaMobileAlt />
                <span>Phone</span>
              </button>
              <button
                onClick={() => {
                  setDeviceType("ipad");
                  setCurrentIndex(0);
                }}
                className={`px-4 py-2 rounded-full flex items-center gap-2 transition-colors ${
                  deviceType === "ipad"
                    ? "bg-white text-gray-900"
                    : "text-white hover:bg-gray-700/50"
                }`}
              >
                <FaTabletAlt />
                <span>Tablet</span>
              </button>
            </div>
          </div>

          {/* Image Carousel */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.img
              key={`${deviceType}-${currentIndex}`}
              src={currentScreenshots[currentIndex].src}
              alt={currentScreenshots[currentIndex].alt}
              className="w-full h-full object-contain absolute top-0 left-0"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
            />
          </AnimatePresence>

          {/* Navigation Arrows and Dots */}
          <div className="relative w-full h-full overflow-hidden">
            {/* Navigation Arrows */}
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors z-10"
              aria-label="Previous image"
            >
              <FaChevronLeft className="text-xl" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
              aria-label="Next image"
            >
              <FaChevronRight className="text-xl" />
            </button>

            {/* Dots Indicator */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {currentScreenshots.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentIndex ? "bg-white" : "bg-white/50"
                  }`}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 lg:p-8 lg:overflow-y-auto">
          <h3 className="text-2xl font-bold mb-4">
            Scythe Robotics Mobile App
          </h3>

          <div className="flex gap-4 mb-6">
            <a
              href="https://apps.apple.com/us/app/scythe-robotics/id1671836132"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
            >
              <FaAppStore className="text-xl" />
              <span>App Store</span>
            </a>
            <a
              href="https://play.google.com/store/apps/details?id=com.scytherobotics.takeout"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
            >
              <FaGooglePlay className="text-xl" />
              <span>Play Store</span>
            </a>
          </div>

          <p className="text-gray-600 mb-6">
            Led the development of a comprehensive fleet management mobile
            application for Scythe Robotics' autonomous commercial mowers. The
            app provides real-time monitoring, control, and management
            capabilities for landscape contractors.
          </p>

          <div className="space-y-3">
            <h4 className="font-semibold">Key Features:</h4>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Real-time mower location and status tracking</li>
              <li>Battery level and charging status monitoring</li>
              <li>Zone management with map imagery</li>
              <li>Bilingual support (English/Spanish)</li>
              <li>Remote mower settings adjustment</li>
              <li>Push notifications for alerts and updates</li>
              <li>Usage statistics and performance metrics</li>
            </ul>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="font-semibold mb-3">Technologies & Skills:</h4>
            <div className="flex flex-wrap gap-2">
              {[
                { name: "Capacitor", url: "https://capacitorjs.com" },
                { name: "Cordova", url: "https://cordova.apache.org" },
                { name: "GitLab CI/CD", url: "https://docs.gitlab.com/ee/ci/" },
                { name: "GraphQL", url: "https://graphql.org" },
                { name: "Highlight.io", url: "https://highlight.io" },
                { name: "Ionic", url: "https://ionicframework.com" },
                { name: "Knock", url: "https://knock.app" },
                { name: "MapBox", url: "https://www.mapbox.com" },
                {
                  name: "MobileBoost / GPT Driver",
                  url: "https://www.mobileboost.io/",
                },
                { name: "Node.js", url: "https://nodejs.org" },
                { name: "PigeonMaps", url: "https://pigeon-maps.js.org" },
                { name: "React", url: "https://reactjs.org" },
                { name: "Statsig", url: "https://statsig.com" },
                { name: "TypeScript", url: "https://www.typescriptlang.org" },
                { name: "Vercel", url: "https://vercel.com" },
                { name: "XCode", url: "https://developer.apple.com/xcode" },
                { name: "Zustand", url: "https://zustand-demo.pmnd.rs" },
              ].map(({ name, url }) => (
                <a
                  key={name}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                >
                  {name}
                </a>
              ))}
            </div>
          </div>

          {/* Disclaimer at bottom */}
          {disclaimer && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500 italic">{disclaimer}</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ScytheProject;
