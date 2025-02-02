/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      screens: {
        xs: "475px",
      },
      colors: {
        primary: {
          50: "var(--primary-50)",
          100: "var(--primary-100)",
          200: "var(--primary-200)",
          300: "var(--primary-300)",
          400: "var(--primary-400)",
          500: "var(--primary-500)",
          600: "var(--primary-600)",
          700: "var(--primary-700)",
          800: "var(--primary-800)",
          900: "var(--primary-900)",
          DEFAULT: "var(--primary-600)",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui"],
        montserrat: ["Montserrat", "sans-serif"],
        lato: ["Lato", "sans-serif"],
      },
      keyframes: {
        wave1: {
          "0%": { transform: "translateX(0) translateZ(0) scaleY(1)" },
          "50%": { transform: "translateX(-25%) translateZ(0) scaleY(0.55)" },
          "100%": { transform: "translateX(-50%) translateZ(0) scaleY(1)" },
        },
        wave2: {
          "0%": { transform: "translateX(0) translateZ(0) scaleY(1)" },
          "50%": { transform: "translateX(-25%) translateZ(0) scaleY(0.45)" },
          "100%": { transform: "translateX(-50%) translateZ(0) scaleY(1)" },
        },
        wave3: {
          "0%": { transform: "translateX(0) translateZ(0) scaleY(1)" },
          "50%": { transform: "translateX(-25%) translateZ(0) scaleY(0.35)" },
          "100%": { transform: "translateX(-50%) translateZ(0) scaleY(1)" },
        },
      },
      animation: {
        wave1: "wave1 25s cubic-bezier(0.36, 0.45, 0.63, 0.53) infinite",
        wave2: "wave2 25s cubic-bezier(0.36, 0.45, 0.63, 0.53) infinite",
        wave3: "wave3 25s cubic-bezier(0.36, 0.45, 0.63, 0.53) infinite",
      },
    },
  },
  plugins: [],
};
