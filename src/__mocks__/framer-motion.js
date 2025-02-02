import React from "react";

const createMotionValue = (initial = 0) => ({
  get: () => initial,
  set: () => {},
  onChange: () => () => {},
});

const scrollValue = createMotionValue(0);
const scrollProgressValue = createMotionValue(0);

export const useScroll = () => ({
  scrollY: scrollValue,
  scrollYProgress: scrollProgressValue,
  scrollX: scrollValue,
  scrollXProgress: scrollProgressValue,
});

export const useTransform = () => createMotionValue(0);

export const useMotionValue = (initial) => createMotionValue(initial);

export const useSpring = () => createMotionValue(0);

export const animate = () => Promise.resolve();

export const useAnimation = () => ({
  start: () => Promise.resolve(),
  stop: () => {},
  set: () => {},
});

export const useInView = () => [true, null];

export const useReducedMotion = () => false;

export const AnimatePresence = ({ children }) => children;

export const LazyMotion = ({ children }) => children;

export const useViewportScroll = () => ({
  scrollY: scrollValue,
  scrollYProgress: scrollProgressValue,
  scrollX: scrollValue,
  scrollXProgress: scrollProgressValue,
});

export const domAnimation = true;

// Create motion components
const createMotionComponent = (type) => {
  const Component = React.forwardRef((props, ref) => {
    return React.createElement(type, { ...props, ref }, props.children);
  });
  Component.displayName = `motion.${type}`;
  return Component;
};

const htmlElements = [
  "div",
  "h1",
  "h2",
  "h3",
  "h4",
  "p",
  "span",
  "a",
  "nav",
  "header",
  "section",
  "button",
  "img",
  "ul",
  "li",
  "footer",
  "main",
  "article",
  "aside",
  "form",
  "input",
];

const motion = {};
htmlElements.forEach((type) => {
  motion[type] = createMotionComponent(type);
});

export { motion };
export const m = motion;
