import React, { useState } from 'react';
import { motion } from 'framer-motion';
import InteractivePresentation from './InteractivePresentation';
import { PlayIcon, PresentationChartBarIcon } from '@heroicons/react/24/outline';

const PresentationLauncher = () => {
  const [isPresentationOpen, setIsPresentationOpen] = useState(false);

  const openPresentation = () => {
    setIsPresentationOpen(true);
  };

  const closePresentation = () => {
    setIsPresentationOpen(false);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white shadow-lg hover:shadow-xl transition-shadow"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-4">
              <PresentationChartBarIcon className="w-8 h-8" />
              <h3 className="text-2xl font-bold">Interactive Presentation</h3>
            </div>
            <p className="text-blue-100 mb-6 text-lg">
              Explore my key technical achievements and problem-solving stories that demonstrate my front-end engineering capabilities. 
              This interactive presentation showcases real-world challenges I've solved, from authentication innovation to complex UX problems.
            </p>
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm">React + Ionic</span>
              <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm">Stytch Auth</span>
              <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm">Push Notifications</span>
              <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm">UX Problem Solving</span>
              <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm">Developer Tools</span>
              <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm">5 Stories</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={openPresentation}
              className="inline-flex items-center space-x-2 bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              <PlayIcon className="w-5 h-5" />
              <span>Launch Presentation</span>
            </motion.button>
          </div>
          <div className="hidden md:block ml-8">
            <div className="w-32 h-32 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <PresentationChartBarIcon className="w-16 h-16 text-white" />
            </div>
          </div>
        </div>
      </motion.div>

      <InteractivePresentation 
        isOpen={isPresentationOpen} 
        onClose={closePresentation} 
      />
    </>
  );
};

export default PresentationLauncher;
