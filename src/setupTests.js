// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

// Mock TextEncoder/TextDecoder
// global.TextEncoder = require("util").TextEncoder;
// global.TextDecoder = require("util").TextDecoder;

// Mock IntersectionObserver
class IntersectionObserver {
  constructor(callback, options) {
    this.callback = callback;
    this.options = options;
  }
  observe(target) {
    this.callback([{ target, isIntersecting: true }]);
    return () => this.unobserve(target);
  }
  unobserve(target) {
    // Logic to unobserve the target
  }
  disconnect() {
    // Logic to disconnect all targets
  }
}

global.IntersectionObserver = IntersectionObserver;

// Mock PostHog
jest.mock("posthog-js", () => ({
  init: jest.fn(),
  capture: jest.fn(),
}));

// Mock LogRocket
jest.mock("logrocket", () => ({
  init: jest.fn(),
  identify: jest.fn(),
  track: jest.fn(),
}));

// Mock framer-motion and useInView if necessary
jest.mock("framer-motion", () => ({
  motion: {
    div: "div",
    span: "span",
  },
  useAnimation: () => ({
    start: jest.fn(),
    stop: jest.fn(),
  }),
}));

jest.mock("react-intersection-observer", () => ({
  useInView: () => [null, true],
}));
