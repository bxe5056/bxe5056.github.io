import React, { useState } from "react";
import PageContainer from "../components/common/PageContainer";
import {
  FaDog,
  FaWater,
  FaGamepad,
  FaSkiing,
  FaSkating,
  FaGem,
  FaCube,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

const hobbies = [
  {
    title: "Tesla Bear",
    subtitle: "My Mini Australian Shepherd",
    description: "My energetic companion who keeps me active and entertained.",
    icon: FaDog,
    color: "from-blue-400 to-blue-600",
    images: [
      {
        src: "/images/hobbies/tesla/tesla1.jpg",
        alt: "Tesla playing at the park",
        type: "image",
      },
      {
        src: "/images/hobbies/tesla/tesla2.gif",
        alt: "Tesla squeaking her toy",
        type: "gif",
      },
      {
        src: "/images/hobbies/tesla/tesla3.jpg",
        alt: "Tesla taking a nap",
        type: "image",
      },
    ],
  },
  {
    title: "Kayaking",
    subtitle: "Exploring Colorado Waters",
    description: "Finding peace and adventure on the water.",
    icon: FaWater,
    color: "from-teal-400 to-teal-600",
    images: [
      {
        src: "/images/hobbies/kayak/kayak1.jpg",
        alt: "Kayaking down a stream in Massachusetts with Tesla",
        type: "image",
      },
      {
        src: "/images/hobbies/kayak/kayak2.jpg",
        alt: "Kayaking on the Charles River",
        type: "image",
      },
      {
        src: "/images/hobbies/kayak/kayak3.jpg",
        alt: "Tesla not thrilled that she got wet while kayaking",
        type: "image",
      },
    ],
  },
  {
    title: "Gaming",
    subtitle: "PC & Console Gaming",
    description: "Enjoying both competitive and story-driven games.",
    icon: FaGamepad,
    color: "from-purple-400 to-purple-600",
  },
  {
    title: "Skiing",
    subtitle: "Colorado Mountains",
    description: "Taking advantage of the beautiful Rocky Mountains.",
    icon: FaSkiing,
    color: "from-indigo-400 to-indigo-600",
  },
  {
    title: "Ice Skating",
    subtitle: "Gliding on Ice",
    description:
      "Embracing winter sports and improving balance through ice skating.",
    icon: FaSkating,
    color: "from-cyan-400 to-cyan-600",
  },
  {
    title: "Gold Panning",
    subtitle: "Colorado's Hidden Treasures",
    description:
      "Exploring Colorado's rich mining history while searching for gold in mountain streams.",
    icon: FaGem,
    color: "from-yellow-400 to-yellow-600",
  },
  {
    title: "3D Printing",
    subtitle: "Custom Guitar Creation",
    description:
      "Combining technology and a builder-mindset through 3D printed instruments and other creative engineering projects. Want one? Let me know!",
    icon: FaCube,
    color: "from-red-400 to-red-600",
    images: [
      {
        src: "/images/hobbies/guitars/guitar1.jpg",
        alt: "3D Printed Electric Guitar - Clemson Tigers",
      },
      {
        src: "/images/hobbies/guitars/guitar2.jpg",
        alt: "3D Printed Electric Guitar - In the making",
      },
      {
        src: "/images/hobbies/guitars/guitar3.jpg",
        alt: "3D Printed Electric Guitar - Penn State Nittany Lions Hockey",
      },
    ],
  },
];

const ImageGallery = ({ images, isOpen, onClose, initialIndex = 0 }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (!isOpen) return null;

  const currentImage = images[currentIndex];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl px-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
        >
          <FaTimes className="text-2xl" />
        </button>
        <div className="relative">
          <img
            key={currentImage.src}
            src={currentImage.src}
            alt={currentImage.alt}
            className={`w-full h-auto max-h-[80vh] object-contain ${
              currentImage.type === "gif" ? "!preserve-animation" : ""
            }`}
          />
          <button
            onClick={prevImage}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300"
          >
            <FaChevronLeft className="text-2xl" />
          </button>
          <button
            onClick={nextImage}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300"
          >
            <FaChevronRight className="text-2xl" />
          </button>
        </div>
        <p className="text-white text-center mt-4">
          {currentImage.alt}
          {currentImage.type === "gif" && " (Animated GIF)"}
        </p>
      </div>
    </motion.div>
  );
};

const About = () => {
  const [selectedGallery, setSelectedGallery] = useState(null);

  return (
    <PageContainer
      title="About Me"
      subtitle="When I'm not coding, you can find me enjoying these activities"
    >
      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {hobbies.map((hobby, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 group"
          >
            <div className="flex items-start gap-4">
              <div
                className={`p-3 rounded-lg bg-gradient-to-br ${hobby.color} text-white transform group-hover:scale-110 transition-transform duration-300`}
              >
                <hobby.icon className="text-2xl" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold font-montserrat text-gray-800 mb-2">
                  {hobby.title}
                </h3>
                <h4 className="text-md font-medium text-primary-600 mb-3">
                  {hobby.subtitle}
                </h4>
                <p className="text-gray-600">{hobby.description}</p>
                {hobby.images && (
                  <div className="mt-4">
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {hobby.images.map((image, imgIndex) => (
                        <img
                          key={imgIndex}
                          src={image.src}
                          alt={image.alt}
                          className="w-24 h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() =>
                            setSelectedGallery({
                              images: hobby.images,
                              initialIndex: imgIndex,
                            })
                          }
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <AnimatePresence>
        {selectedGallery && (
          <ImageGallery
            {...selectedGallery}
            isOpen={true}
            onClose={() => setSelectedGallery(null)}
          />
        )}
      </AnimatePresence>
    </PageContainer>
  );
};

export default About;
