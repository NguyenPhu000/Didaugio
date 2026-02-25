/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0077b8",
          light: "#e6f3fb",
          dark: "#005f96",
          50: "#e6f3fb",
          100: "#b3d9f1",
          200: "#80bfe7",
          300: "#4da5dd",
          400: "#268bc3",
          500: "#0077b8",
          600: "#0062a0",
          700: "#004d88",
          800: "#003870",
          900: "#002358",
        },
        brand: "#0077b8",
        surface: "#f5f7f8",
        ink: {
          DEFAULT: "#111618",
          secondary: "#737373",
          muted: "#9ca3af",
        },
        danger: {
          DEFAULT: "#ef4444",
          bg: "#fee2e2",
          text: "#dc2626",
        },
        success: {
          DEFAULT: "#22c55e",
          bg: "#dcfce7",
          text: "#16a34a",
        },
        warning: {
          DEFAULT: "#f59e0b",
          bg: "#fef9c3",
          text: "#ca8a04",
        },
        gold: {
          DEFAULT: "#C5A028",
          bg: "#fef3c7",
          text: "#b45309",
          star: "#FBBF24",
        },
      },
      fontFamily: {
        sans: ["BeVietnamPro_400Regular", "System"],
        medium: ["BeVietnamPro_500Medium", "System"],
        semibold: ["BeVietnamPro_600SemiBold", "System"],
        bold: ["BeVietnamPro_700Bold", "System"],
      },
      borderRadius: {
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};
