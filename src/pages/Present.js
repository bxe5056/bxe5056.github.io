import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/outline';

const slides = [
    {
      id: 1,
      title: "Scythe Robotics Fleet Management App",
      subtitle: "React + Ionic Cross-Platform Mobile App",
       content: {
         achievement: "• Field operators needed real-time mower visibility while performing other tasks\n• Required detailed and event-driven monitoring across large outdoor areas\n• Workers were performing value-add activities: weed-eating, leaf blowing, sprinkler maintenance\n• Operators were constantly on the move, and couldn't keep walking over to mower to check on it\n• Operators were often in bright sun, so high-contrast visibility was needed",
         impact: "• Delivered cross-platform mobile app for iOS, Android, and Web\n• Real-time fleet monitoring with live location tracking and status updates\n• High-contrast UI optimized for bright outdoor conditions\n• Push notifications for mower stops, zone violations, and maintenance alerts\n• Interactive zone management with visual editing capabilities",
         implementation: "• Started with single-screen Figma sketch\n• Conducted field research: observed operators, documented workflows\n• Identified pain points and prioritized features\n• Built proof-of-concepts to validate technical approach\n• Chose Ionic with React to pair with existing fleet management web app\n• Cross-platform development for iOS/Android/Web\n• Real-time mapping integration with Mapbox and PigeonMaps\n• Knock integration for push notifications and alerts\n• Zustand state management and GraphQL API integration",
         benefits: "• Operators can monitor mowers from anywhere in the field\n• Real-time push notifications keep operators informed of critical events\n• Increased productivity through multi-tasking\n• Reduced downtime and improved efficiency\n• Seamless integration with existing fleet management infrastructure",
         technologies: ["React", "Ionic", "TypeScript", "Zustand", "Mapbox", "PigeonMaps", "Knock", "GraphQL"],
         metrics: [
           "Cross-platform compatibility (iOS/Android/Web)",
           "Detailed mapping with real-time pushupdates",
           "Hundreds of active fleet vehicles and increasing",
           "App Store & Play Store"
         ]
       },
      images: [
        "images/portfolio/scythe/iphone/home.png",
        "images/portfolio/scythe/iphone/support-card.png", 
        "images/portfolio/scythe/iphone/property-viewer.png",
      ],
      color: "from-blue-600 to-blue-800"
    },
    {
      id: 2,
      title: "Scythe Robotics App Authentication Migration",
      subtitle: "Auth0 to Stytch, Passwordless Auth",
      content: {
        achievement: "• Field workers at landscaping companies often lacked company email addresses\n• Managers needed email-based authentication while workers needed phone-based access\n• Apple's strict authentication guidelines required native app integration\n• Clients needed complex multi-crew hierarchies with advanced groupings\n• Remote control limitations required geo-location based operation checks",
        implementation: "• Audited existing Auth0 implementation and evaluated Stytch alternatives\n• Designed zero-downtime migration strategy with fallback methods\n• Built dual authentication system supporting both email and phone-based login\n• Created custom branded login experience with Stytch SDK\n• Created fallback authentication for edge cases (i.e. Scythers)\n• Integrated with back-office Fleet management system for role structure\n• Migrated entire platform from Auth0 to Stytch",
        impact: "• Dual authentication system: email-based for managers, phone-based for field workers\n• Geo-location checks for mower operational safety\n• Dynamic role-based access control with nested company hierarchies\n• Data isolation implemented at auth/GraphQL layer\n• Native app integration compliant with Apple guidelines\n• Safety-first approach prevents unauthorized remote mower operation",
        benefits: "• Dual authentication system serves both managers and field workers\n• Zero-friction mobile authentication for field workers\n• Platform-wide migration completed with zero downtime\n• Improved security with phone-based verification (no shared logins)\n• Enhanced safety through geo-location verification\n• Scalable solution supporting hundreds of field operators\n• Compliance with Apple's authentication guidelines",
        technologies: ["Stytch", "Auth0", "React", "Phone OTP", "Passwordless Auth", "Mobile Authentication", "Role-Based Access Control"],
        metrics: [
          "Platform-wide Auth0 to Stytch migration",
          "Zero-friction login for field workers",
          "Hundreds of operators migrated successfully",
          "Multi-team role-based access control"
        ]
      },
      images: [
        "images/portfolio/scythe/fleet-login-stytch.png"
      ],
      color: "from-green-600 to-green-800"
    },
    {
      id: 3,
      title: "Liberty Mutual eClaims System",
      subtitle: "Insurance Claims Processing Platform",
      content: {
        achievement: "• New auto-focused team required immediate technical leadership and onboarding from day seven\n• Legacy monolithic JavaScript backend was limiting scalability and reusability\n• Third-party integrations required for comprehensive claims processing\n• Test suites were slow, flaky, and unreliable across the platform\n• Architecture patterns needed standardization across all claim systems",
        impact: "• Successfully onboarded entire new auto-focused development team\n• Implemented comprehensive third-party integrations for claims processing\n• Migrated from monolithic JavaScript backend to distributed AWS Lambda architecture\n• Applied DNA Software Pattern team expertise to fix pipeline and testing issues\n• Enabled reusability across all Liberty Mutual claim teams",
        implementation: "• Led technical onboarding for new auto-focused team starting day 7\n• Architected migration from monolithic backend to distributed Lambda functions\n• Applied DNA Software Pattern team knowledge to resolve flaky test suites\n• Implemented pipeline fixes and testing improvements across the platform\n• Created reusable components and services for cross-system compatibility",
        benefits: "• Faster, more reliable test execution through pipeline improvements\n• Scalable distributed architecture enabling system-wide reusability\n• Streamlined team onboarding with clear technical foundations\n• Robust third-party integrations supporting comprehensive claims processing\n• Standardized architecture patterns across all claim systems\n• Reduced technical debt and improved maintainability",
        technologies: ["AWS Lambda", "JavaScript", "Third-Party APIs", "Test Automation", "CI/CD Pipelines", "Microservices", "DNA Software Patterns", "Team Onboarding"],
        metrics: [
          "Complete team onboarding starting day 7",
          "Monolithic to distributed architecture migration",
          "Third-party integrations implemented",
          "Pipeline and testing reliability improvements"
        ]
      },
      images: [
        "images/portfolio/limu-claim/claim-filing.jpg",
        "images/portfolio/limu-claim/limu-claim-app.png"
      ],
      color: "from-orange-600 to-orange-800"
    },
    {
      id: 4,
      title: "Developer Tools Suite",
      subtitle: "Portfolio Website & Community Tools",
      content: {
        achievement: "• 3D printing community lacks accessible tools for SVG modification and color separation\n• Existing solutions are either expensive, complex, or don't handle specific use cases\n• Needed simple, web-based tools for pattern and image processing\n• Gap in free, user-friendly tools for creative workflows\n• Solution needed to be free or near-free to host and run",
        impact: "• Built comprehensive suite of developer tools including SVG optimization, color conversion, PDF manipulation, and data processing\n• Created accessible web-based tools\n• Made tools publicly available on portfolio site for community use\n• Provided practical solutions for common development and creative challenges",
        implementation: "• Identified needs: SVG modification for 3D printing guitar overlays\n• Researched existing solutions and found gap in free tools market\n• Integrated tools into portfolio website for public access and demonstration\n• Needed implementation to be privacy and security aware\n• Contained in freely-hosted portfolio site",
        benefits: "• Streamlined creative workflows with automated SVG processing\n• Enabled consistent pattern and image processing for various projects\n• Provided free, in-browser, and easy-to-use tools for the community\n• Created reusable solutions for common dev challenges\n• Ability to expand toolset as needed",
        technologies: ["React", "TypeScript", "PDF.js/SVG", "File Conversion", "3D Printing", "GitHub Pages/Actions"],
        metrics: [
          "10+ specialized tools created",
          "Personal 3D printing project solution",
          "Public portfolio integration with GitHub Pages",
          "GitHub Actions for continuous deployment",
          "Real-world problem solving"
        ]
      },
      images: [
        "images/portfolio/toolspage/tools.png"
      ],
      color: "from-indigo-600 to-indigo-800"
    }
];

const Present = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAutoCycling, setIsAutoCycling] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  const goToSlide = useCallback((index) => {
    setCurrentSlide(index);
    setCurrentImageIndex(0); // Reset image index when changing slides
  }, []);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // Auto-cycle images for slides with multiple images
  useEffect(() => {
    const currentSlideData = slides[currentSlide];
    const hasMultipleImages = currentSlideData.images && currentSlideData.images.length > 1;
    
    if (hasMultipleImages && isAutoCycling) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prevIndex) => 
          (prevIndex + 1) % currentSlideData.images.length
        );
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [currentSlide, isAutoCycling]);

  // Start auto-cycling when slide changes to one with multiple images
  useEffect(() => {
    const currentSlideData = slides[currentSlide];
    const hasMultipleImages = currentSlideData.images && currentSlideData.images.length > 1;
    setIsAutoCycling(hasMultipleImages);
    setCurrentImageIndex(0); // Reset to first image
  }, [currentSlide]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
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
        case 'F11':
          e.preventDefault();
          toggleFullscreen();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide, toggleFullscreen]);

  const currentSlideData = slides[currentSlide];

  return (
    <div className={`h-screen bg-gray-900 flex flex-col ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header */}
      <div 
        className="text-white px-6 flex justify-between items-center flex-shrink-0"
        style={{
          borderBottom: '1px solid rgba(51, 65, 85, 0.08)',
          height: '3.5rem',
          backgroundColor: 'rgba(71, 85, 105, 0.75)',
          backdropFilter: 'blur(16px)',
          boxShadow: 'rgba(51, 65, 85, 0.15) 0px 8px 32px -8px'
        }}
      >
        <div className="flex items-baseline space-x-4">
          <h1 className="text-lg font-bold">Portfolio Presentation</h1>
          <span className="text-xs text-gray-300">
            Slide {currentSlide + 1} of {slides.length}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleFullscreen}
            className="p-1.5 hover:bg-gray-700 rounded transition-colors"
            title="Toggle Fullscreen (F11)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Slide Content */}
      <div className="flex overflow-hidden" style={{ height: 'calc(100vh - 3.5rem - 4rem)', flex: isFullscreen ? '1' : '0.91' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="flex-1 flex h-full bg-gray-200"
          >
             {/* Left Side - Content */}
             <div className="flex-1 px-6 py-3 flex flex-col justify-start pt-8 overflow-y-auto bg-gray-200 rounded-lg mr-4">
               <div className="">
                 <div className="flex items-center justify-between mb-4">
                   <motion.div
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: 0.2 }}
                     className={`inline-block px-4 py-2 rounded-full text-sm font-medium text-white bg-gradient-to-r ${currentSlideData.color}`}
                   >
                     {currentSlideData.subtitle}
                   </motion.div>
                   
                   <div className="text-right">
                     <div className="text-xs font-medium text-gray-600 mb-1">Technologies & Approaches</div>
                     <div className="flex flex-wrap gap-1 justify-end">
                       {currentSlideData.content.technologies.map((tech, index) => (
                         <span
                           key={index}
                           className="px-2 py-1 bg-gray-800 text-white rounded text-xs shadow-sm"
                         >
                           {tech}
                         </span>
                       ))}
                     </div>
                   </div>
                 </div>
                 
                 <motion.h1
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.3 }}
                   className="text-3xl font-bold text-gray-800 mb-4"
                 >
                   {currentSlideData.title}
                 </motion.h1>

                 <motion.div
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.4 }}
                   className="space-y-4"
                 >
                   {/* 2x2 Grid for main content cards */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                       <h3 className="text-base font-semibold text-gray-900 mb-2">The Challenge</h3>
                       <div className="text-gray-700 text-sm whitespace-pre-line">{currentSlideData.content.achievement}</div>
                     </div>

                     <div className="bg-green-50 p-4 rounded-lg shadow-sm border border-green-200">
                       <h3 className="text-base font-semibold text-green-900 mb-2">Implementation Process</h3>
                       <div className="text-green-800 text-sm whitespace-pre-line">{currentSlideData.content.implementation || "• Cross-platform React + Ionic development\n• Real-time mapping integration with Mapbox GL JS\n• Mobile-optimized PigeonMaps implementation\n• Zustand state management for complex data flows"}</div>
                     </div>

                     <div className="bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-200">
                       <h3 className="text-base font-semibold text-blue-900 mb-2">The Solution</h3>
                       <div className="text-blue-800 text-sm whitespace-pre-line">{currentSlideData.content.impact}</div>
                     </div>

                     <div className="bg-purple-50 p-4 rounded-lg shadow-sm border border-purple-200">
                       <h3 className="text-base font-semibold text-purple-900 mb-2">The Benefits</h3>
                       <div className="text-purple-800 text-sm whitespace-pre-line">{currentSlideData.content.benefits || "• Operators can monitor mowers from anywhere in the field\n• Increased productivity through multi-tasking\n• Real-time alerts and status updates\n• Reduced downtime and improved efficiency"}</div>
                     </div>
                   </div>

                 </motion.div>
              </div>
            </div>

            {/* Right Side - Visual */}
            <div 
              className={`${currentSlide === 3 ? 'w-[32rem]' : 'w-80'} bg-gradient-to-br from-gray-800 to-gray-900 px-4 py-4 flex flex-col`}
              style={currentSlide === 1 ? { width: '24rem' } : {}}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center h-full flex flex-col"
              >
                
                {/* Image Carousel */}
                <div className="flex-1 flex flex-col min-h-0">
                  {/* Portfolio Picture - fills horizontally */}
                  <div 
                    className="flex-1 flex items-center justify-center relative overflow-hidden rounded-lg bg-gray-700 min-h-0"
                    style={currentSlide === 1 ? { height: '24rem' } : {}}
                  >
                    <div className="relative w-full h-full">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={`${currentSlide}-${currentImageIndex}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ 
                            duration: 0.4,
                            ease: "easeInOut"
                          }}
                          className="w-full h-full flex items-center justify-center"
                        >
                        <img
                          src={currentSlideData.images[currentImageIndex] || currentSlideData.images[0]}
                          alt={`App screenshot ${currentImageIndex + 1}`}
                          className="w-full h-full object-cover rounded-lg shadow-lg"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                          <div className="hidden w-full h-full bg-gray-700 rounded-lg items-center justify-center text-gray-400 text-sm">
                            <span>Image not available</span>
                          </div>
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </div>
                  
                  {/* Guitar Picture for Developer Tools Slide - fills remaining vertical space */}
                  {currentSlide === 3 && (
                    <motion.div 
                      className="flex-1 flex items-center justify-center relative overflow-hidden rounded-lg bg-gray-700 min-h-0 mt-2"
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ 
                        duration: 0.5, 
                        ease: "easeInOut",
                        delay: 0.2
                      }}
                    >
                      <img
                        src="images/hobbies/guitars/guitar1.jpg"
                        alt="3D Printed Guitar with SVG Overlays"
                        className="w-full h-full object-cover rounded-lg shadow-lg"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="hidden w-full h-full bg-gray-700 rounded-lg items-center justify-center text-gray-400 text-sm">
                        <span>Guitar image not available</span>
                      </div>
                    </motion.div>
                  )}
                  
                  {/* Image Thumbnails */}
                  {currentSlideData.images.length > 1 && (
                    <motion.div 
                      className="mt-2 flex justify-center space-x-1 overflow-x-auto pb-1 flex-shrink-0"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                    >
                      {currentSlideData.images.map((image, index) => (
                        <motion.button
                          key={index}
                          onClick={() => {
                            setCurrentImageIndex(index);
                            setIsAutoCycling(false); // Pause auto-cycling when user manually selects
                          }}
                          className={`flex-shrink-0 w-8 h-8 rounded overflow-hidden border-2 transition-all ${
                            currentImageIndex === index 
                              ? 'border-blue-500 ring-1 ring-blue-300' 
                              : 'border-gray-600 hover:border-gray-400'
                          }`}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                        >
                          <img
                            src={image}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div className="hidden w-full h-full bg-gray-700 items-center justify-center text-gray-400 text-xs">
                            <span>?</span>
                          </div>
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="bg-gray-800/80 backdrop-blur-md px-6 py-2 flex justify-between items-center flex-shrink-0 border-t border-gray-700">
        <button
          onClick={prevSlide}
          disabled={currentSlide === 0}
          className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors text-white text-sm"
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
                index === currentSlide ? 'bg-blue-500' : 'bg-gray-500 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>

        <button
          onClick={nextSlide}
          disabled={currentSlide === slides.length - 1}
          className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors text-white text-sm"
        >
          <span>Next</span>
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Present;
