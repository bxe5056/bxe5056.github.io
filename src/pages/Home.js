import React from "react";
import { Link } from "react-router-dom";
import {
  FaGithub,
  FaLinkedin,
  FaArrowRight,
  FaEnvelope,
  FaPhone,
} from "react-icons/fa";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20,
      mass: 1,
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

const connectVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const connectItemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const AnimatedText = ({ children, className = "" }) => {
  const words = children.split(" ");
  let totalPreviousChars = 0;

  return (
    <span className="inline-flex gap-2">
      {words.map((word, wordIndex) => (
        <span key={wordIndex} className="inline-flex">
          {word.split("").map((char, charIndex) => {
            // Calculate the total delay based on all previous characters
            const delay = (totalPreviousChars + charIndex) * 0.05;
            // If this is the last character of the word, add to the total
            if (charIndex === word.length - 1) {
              totalPreviousChars += word.length;
            }
            return (
              <span
                key={charIndex}
                className={`inline-block hover-bounce ${className}`}
                style={{ animationDelay: `${delay}s` }}
              >
                {char}
              </span>
            );
          })}
        </span>
      ))}
    </span>
  );
};

const Home = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-start pt-4 xs:pt-8 sm:pt-16 md:pt-24 lg:pt-32 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.015]" />
        </div>

        {/* Profile Image - Full width background */}
        <motion.div
          className="absolute inset-0 w-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="sticky top-0 h-screen w-full">
            <img
              src="/images/profile.jpg"
              alt="Benjamin Eppinger"
              className="absolute w-full h-[calc(100%+25rem)] object-cover object-[60%_90%] -top-64 xs:-top-72 sm:-top-80 md:-top-88 lg:-top-96"
            />
            {/* Subtle shadow for text readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/5 to-transparent" />
          </div>
        </motion.div>

        {/* Content Container */}
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Text Content */}
            <motion.div
              className="text-center lg:text-left p-3 sm:p-4 lg:p-16 rounded-2xl backdrop-blur-lg bg-white/25 
                         shadow-[0_35px_60px_-15px_rgba(0,0,0,0.2)] relative overflow-hidden min-h-[250px] xs:min-h-[300px] sm:min-h-[350px] md:min-h-[300px] lg:min-h-[300px]
                         after:absolute after:inset-0 after:bg-gradient-to-br after:from-white/10 after:to-transparent after:rounded-2xl
                         flex flex-col justify-between lg:-ml-16 lg:pl-16"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {/* Glass reflections */}
              <motion.div
                className="absolute -inset-full bg-[linear-gradient(to_right,transparent,transparent_25%,rgba(255,255,255,0.15)_50%,transparent_75%,transparent)]"
                animate={{
                  x: ["100%", "-100%"],
                  transition: {
                    repeat: Infinity,
                    duration: 5,
                    ease: "linear",
                  },
                }}
              />
              <motion.div
                className="absolute -inset-full bg-[linear-gradient(to_right,transparent,transparent_25%,rgba(255,255,255,0.08)_50%,transparent_75%,transparent)]"
                animate={{
                  x: ["-100%", "100%"],
                  transition: {
                    repeat: Infinity,
                    duration: 7,
                    ease: "linear",
                  },
                }}
              />
              <div className="space-y-0.5 sm:space-y-2 w-full max-w-lg mx-auto">
                <motion.h1
                  variants={itemVariants}
                  className="text-xl xs:text-1xl sm:text-2xl md:text-3xl lg:text-4xl font-bold font-montserrat bg-clip-text text-transparent bg-gradient-to-r from-blue-800 to-blue-600 leading-none pt-2"
                >
                  <AnimatedText>Benjamin Eppinger</AnimatedText>
                </motion.h1>
                <motion.h2
                  variants={itemVariants}
                  className="text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl text-gray-700 font-light leading-none -mt-1"
                >
                  <AnimatedText>Full-Stack Developer</AnimatedText>
                </motion.h2>
                <motion.p
                  variants={itemVariants}
                  className="text-xs xs:text-sm sm:text-base md:text-lg text-gray-800 leading-tight mt-1"
                >
                  Building intuitive and scalable web applications with modern
                  technologies. Based in Denver, CO, specializing in React and
                  cross-platform mobile development.
                </motion.p>
              </div>

              {/* CTA Buttons */}
              <motion.div
                variants={itemVariants}
                className="flex flex-col gap-2 justify-center pt-2 max-w-lg mx-auto w-full relative z-10 isolate"
              >
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className="w-full"
                >
                  <Link
                    to="/portfolio"
                    className="btn btn-primary group text-xs xs:text-sm sm:text-base w-full inline-flex items-center justify-center"
                  >
                    <AnimatedText>View My Work</AnimatedText>
                    <FaArrowRight className="transition-transform group-hover:translate-x-1 text-lg" />
                  </Link>
                </motion.div>
                <div className="flex gap-2 w-full">
                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    className="w-1/2"
                  >
                    <a
                      href="https://github.com/bxe5056"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn text-xs xs:text-sm sm:text-base w-full inline-flex items-center justify-center border-2 border-gray-700 text-gray-700 hover:bg-gray-700 hover:text-white transition-colors bg-white/80 backdrop-blur-sm"
                    >
                      <FaGithub className="text-lg" />
                      <AnimatedText>GitHub</AnimatedText>
                    </a>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    className="w-1/2"
                  >
                    <a
                      href="https://www.linkedin.com/in/benjamindeppingerpsu"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn text-xs xs:text-sm sm:text-base w-full inline-flex items-center justify-center border-2 border-gray-700 text-gray-700 hover:bg-gray-700 hover:text-white transition-colors bg-white/80 backdrop-blur-sm"
                    >
                      <FaLinkedin className="text-lg" />
                      <AnimatedText>LinkedIn</AnimatedText>
                    </a>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Let's Connect Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-4xl mx-auto text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={connectVariants}
          >
            <motion.h2
              variants={connectItemVariants}
              className="text-3xl font-bold font-montserrat mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-800"
            >
              Let's Connect
            </motion.h2>
            <motion.p
              variants={connectItemVariants}
              className="text-base text-gray-600 mb-12"
            >
              I'm always open to discussing new projects, opportunities, and
              collaborations.
            </motion.p>
            <div className="grid md:grid-cols-4 gap-8">
              {[
                {
                  icon: FaEnvelope,
                  title: "Email",
                  text: "bxe5056@gmail.com",
                  href: "mailto:bxe5056@gmail.com",
                },
                {
                  icon: FaGithub,
                  title: "GitHub",
                  text: "@bxe5056",
                  href: "https://github.com/bxe5056",
                },
                {
                  icon: FaPhone,
                  title: "Phone",
                  text: "(814) 310-8292",
                  href: "tel:+18143108292",
                },
                {
                  icon: FaLinkedin,
                  title: "LinkedIn",
                  text: "Let's Connect",
                  href: "https://www.linkedin.com/in/benjamindeppingerpsu",
                },
              ].map((item, index) => (
                <motion.a
                  key={item.title}
                  variants={connectItemVariants}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  href={item.href}
                  target={item.href.startsWith("mailto") ? undefined : "_blank"}
                  rel={
                    item.href.startsWith("mailto")
                      ? undefined
                      : "noopener noreferrer"
                  }
                  className="group p-6 bg-gray-50 rounded-xl hover:bg-primary-50 transition-all duration-300 hover:shadow-lg"
                >
                  <div className="mb-4">
                    <item.icon className="text-3xl text-primary-600 mx-auto group-hover:scale-110 transition-transform" />
                  </div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.text}</p>
                </motion.a>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
