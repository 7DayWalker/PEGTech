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
        // Dark charcoal theme (Google AI Studio inspired)
        dark: {
          900: "#0a0a0d", // near-black charcoal
          800: "#131318", // cards
          700: "#1f1f26", // borders
          600: "#333340", // muted
        },
        blue: {
          50: "#eff6ff",
          100: "#dbeafe",
          500: "#2E8CFF",
          600: "#0B4FD8",
          900: "#06259A",
        },
        // PEGTech official brand palette (from PEGTech Final Logo System)
        gemini: {
          blue: "#2E8CFF",
          purple: "#0B4FD8",
          pink: "#E00E0E",
        },
        brand: {
          blue: "#2E8CFF",
          blueMid: "#0B4FD8",
          blueDeep: "#06259A",
          red: "#FF5230",
          redMid: "#E00E0E",
          redDeep: "#9E0000",
        },
        accent: {
          DEFAULT: "#2E8CFF",
          foreground: "#ffffff",
          hover: "#0B4FD8",
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
        success: {
          DEFAULT: "#10b981",
        },
        warning: {
          DEFAULT: "#f59e0b",
        },
        error: {
          DEFAULT: "#ef4444",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        display: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      backgroundImage: {
        // Exact gradient used in the official PEGTech logo wordmark
        "gemini-gradient": "linear-gradient(90deg, #2E8CFF 0%, #0B4FD8 55%, #E00E0E 100%)",
        "gemini-gradient-vertical": "linear-gradient(180deg, #2E8CFF 0%, #0B4FD8 55%, #E00E0E 100%)",
      },
      animation: {
        "fade-in": "fadeIn 0.8s ease-out forwards",
        "slide-up": "slideUp 0.8s ease-out forwards",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 8s ease-in-out infinite",
        "float-delayed": "float 10s ease-in-out infinite 2s",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translate(0, 0)" },
          "50%": { transform: "translate(20px, -30px)" },
        },
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: '65ch',
            color: '#e2e8f0',
            h1: { color: '#ffffff' },
            h2: { color: '#ffffff' },
            h3: { color: '#ffffff' },
            h4: { color: '#ffffff' },
            h5: { color: '#ffffff' },
            h6: { color: '#ffffff' },
            a: { color: '#3b82f6', textDecoration: 'underline' },
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
}
