/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark theme inspired by CX Pros aesthetic
        dark: {
          900: "#020617", // near-black background
          800: "#0f172a", // card background
          700: "#1e293b", // borders
          600: "#334155", // muted text
        },
        accent: {
          DEFAULT: "#fbbf24", // amber/gold accent
          foreground: "#020617",
          hover: "#f59e0b",
        },
        primary: {
          DEFAULT: "#ffffff",
          foreground: "#020617",
        },
        secondary: {
          DEFAULT: "#1e293b",
          foreground: "#f1f5f9",
        },
        muted: {
          DEFAULT: "#334155",
          foreground: "#94a3b8",
        },
        card: {
          DEFAULT: "#0f172a",
          foreground: "#f1f5f9",
        },
        border: {
          DEFAULT: "#1e293b",
        },
        input: {
          DEFAULT: "#1e293b",
        },
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        display: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out forwards",
        "slide-up": "slideUp 0.7s ease-out forwards",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
}
