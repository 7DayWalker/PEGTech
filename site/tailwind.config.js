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
        // Dark theme with blue/tech accent
        dark: {
          900: "#020617", // near-black
          800: "#0f172a", // cards
          700: "#1e293b", // borders
          600: "#334155", // muted
        },
        blue: {
          50: "#eff6ff",
          100: "#dbeafe",
          500: "#3b82f6",
          600: "#2563eb",
          900: "#1e3a8a",
        },
        accent: {
          DEFAULT: "#3b82f6",
          foreground: "#ffffff",
          hover: "#2563eb",
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
      animation: {
        "fade-in": "fadeIn 0.8s ease-out forwards",
        "slide-up": "slideUp 0.8s ease-out forwards",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
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
