import React, { useState } from "react";
import { Container } from "react-bootstrap";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronLeft, FaChevronRight, FaTimes } from "react-icons/fa";

const hobbies = [
  {
    title: "Tesla Bear",
    subtitle: "My Mini Australian Shepherd",
    description: "My energetic companion who keeps me active and entertained.",
    images: [
      {
        src: "/images/hobbies/tesla/tesla1.jpg",
        alt: "Tesla Bear playing in the snow",
      },
      {
        src: "/images/hobbies/tesla/tesla2.jpg",
        alt: "Tesla Bear on a hike",
      },
      {
        src: "/images/hobbies/tesla/tesla3.jpg",
        alt: "Tesla Bear being playful",
      },
    ],
  },
  {
    title: "Kayaking",
    subtitle: "Exploring Colorado Waters",
    description: "Finding peace and adventure on the water.",
  },
  {
    title: "Gaming",
    subtitle: "PC & Console Gaming",
    description: "Enjoying both competitive and story-driven games.",
  },
  {
    title: "Skiing",
    subtitle: "Colorado Mountains",
    description: "Taking advantage of the beautiful Rocky Mountains.",
  },
  {
    title: "Ice Skating",
    subtitle: "Gliding on Ice",
    description:
      "Embracing winter sports and improving balance through ice skating.",
  },
  {
    title: "Gold Panning",
    subtitle: "Colorado's Hidden Treasures",
    description:
      "Exploring Colorado's rich mining history while searching for gold in mountain streams.",
  },
  {
    title: "3D Printing",
    subtitle: "Custom Guitar Creation",
    description:
      "Pushing the boundaries of 3D printing by creating fully functional guitars and other innovative projects.",
    images: [
      {
        src: "/images/hobbies/guitars/guitar1.jpg",
        alt: "3D Printed Electric Guitar - Front View",
      },
      {
        src: "/images/hobbies/guitars/guitar2.jpg",
        alt: "3D Printed Electric Guitar - Back View",
      },
      {
        src: "/images/hobbies/guitars/guitar3.jpg",
        alt: "3D Printed Electric Guitar - Detail View",
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
            src={images[currentIndex].src}
            alt={images[currentIndex].alt}
            className="w-full h-auto max-h-[80vh] object-contain"
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
          {images[currentIndex].alt}
        </p>
      </div>
    </motion.div>
  );
};

const HobbyCard = ({ title, subtitle, description, images }) => {
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [initialIndex, setInitialIndex] = useState(0);

  return (
    <div className="lg:w-1/2 md:w-full p-4">
      <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-6">
        <h3 className="text-xl font-bold font-montserrat text-gray-800 mb-2">
          {title}
        </h3>
        <h4 className="text-md font-medium text-primary-600 mb-3">
          {subtitle}
        </h4>
        <p className="text-gray-600">{description}</p>
        {images && (
          <div className="mt-4">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((image, index) => (
                <img
                  key={index}
                  src={image.src}
                  alt={image.alt}
                  className="w-24 h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => {
                    setInitialIndex(index);
                    setIsGalleryOpen(true);
                  }}
                />
              ))}
            </div>
          </div>
        )}
        <AnimatePresence>
          {isGalleryOpen && (
            <ImageGallery
              images={images}
              isOpen={true}
              initialIndex={initialIndex}
              onClose={() => setIsGalleryOpen(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const Hobbies = () => {
  return (
    <section className="py-16 bg-gray-50">
      <Container>
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold font-montserrat text-gray-900 mb-4">
            About Me
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            When I'm not coding, you can find me enjoying these activities
          </p>
        </div>
        <div className="flex flex-wrap -m-4 max-w-5xl mx-auto">
          {hobbies.map((hobby, index) => (
            <HobbyCard key={index} {...hobby} />
          ))}
        </div>
      </Container>
    </section>
  );
};

export default Hobbies;
