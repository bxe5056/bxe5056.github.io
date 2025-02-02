import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { FaCheckCircle, FaTag, FaTools } from "react-icons/fa";

const ExperienceItem = ({
  title,
  company,
  date,
  location,
  points,
  category,
  keywords = [],
  technologies = [],
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -100 }}
      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -100 }}
      transition={{
        duration: 0.8,
        delay: 0.2,
        ease: "easeOut",
      }}
      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300 relative"
    >
      <div
        className={`absolute top-0 left-0 w-full h-1 ${category.color} rounded-t-lg`}
      ></div>

      <div
        className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium ${category.bgColor} ${category.textColor}`}
      >
        {category.name}
      </div>

      <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4 pt-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
          <h3 className="text-xl text-primary-600 font-semibold">{company}</h3>
        </div>
        <div className="text-gray-600 mt-2 md:mt-0 md:text-right">
          <div>{date}</div>
          <div>{location}</div>
        </div>
      </div>

      <div className="space-y-2 text-gray-700 mb-4">
        {points.map((point, index) => (
          <div key={index} className="flex items-start gap-2">
            <FaCheckCircle className="text-primary-400 mt-1 flex-shrink-0 text-base" />
            <span className="flex-1">{point}</span>
          </div>
        ))}
      </div>

      {/* Only show section if there are keywords or technologies */}
      {(keywords.length > 0 || technologies.length > 0) && (
        <div className="border-t border-gray-100 pt-4 mt-4">
          {keywords.length > 0 && (
            <div className="mb-2">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <FaTag className="text-primary-400" />
                <span className="font-medium">Keywords:</span>
              </div>
              <div className="flex flex-wrap gap-2 max-w-[800px]">
                {keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {technologies.length > 0 && (
            <div className="mt-2">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <FaTools className="text-primary-400" />
                <span className="font-medium">Technologies:</span>
              </div>
              <div className="flex flex-wrap gap-2 max-w-[800px]">
                {technologies.map((tech, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-primary-50 text-primary-700 rounded-full text-sm"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default ExperienceItem;
