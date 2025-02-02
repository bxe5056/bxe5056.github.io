import React from "react";
import {
  FaReact,
  FaJs,
  FaNodeJs,
  FaDatabase,
  FaMobile,
  FaTools,
} from "react-icons/fa";
import { motion } from "framer-motion";

const skills = [
  {
    category: "Frontend",
    icon: FaReact,
    items: ["React", "JavaScript", "HTML/CSS", "Tailwind CSS", "Material UI"],
    color: "from-blue-400 to-blue-600",
  },
  {
    category: "Backend",
    icon: FaNodeJs,
    items: ["Node.js", "Express", "RESTful APIs", "GraphQL"],
    color: "from-green-400 to-green-600",
  },
  {
    category: "Mobile",
    icon: FaMobile,
    items: ["React Native", "Ionic", "Progressive Web Apps"],
    color: "from-purple-400 to-purple-600",
  },
  {
    category: "Database",
    icon: FaDatabase,
    items: ["MongoDB", "PostgreSQL", "Firebase"],
    color: "from-yellow-400 to-yellow-600",
  },
  {
    category: "Tools",
    icon: FaTools,
    items: ["Git", "Docker", "AWS", "CI/CD", "Agile/Scrum"],
    color: "from-red-400 to-red-600",
  },
];

// Add these variants
const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

const SkillsSection = () => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold font-montserrat text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-800">
          Technical Skills
        </h2>
        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {skills.map((skill) => (
            <motion.div
              key={skill.category}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6"
              variants={cardVariants}
              whileHover={{ y: -5 }}
            >
              <div className="flex items-center gap-4 mb-4">
                <div
                  className={`p-3 rounded-lg bg-gradient-to-br ${skill.color} text-white`}
                >
                  <skill.icon className="text-2xl" />
                </div>
                <h3 className="text-xl font-bold">{skill.category}</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {skill.items.map((item) => (
                  <span
                    key={item}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default SkillsSection;
