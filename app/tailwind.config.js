/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#0077b8",
        secondary: "#00a8e8",
        background: "#ffffff",
        text: "#1a1a1a",
        error: "#ef4444",
        success: "#22c55e",
        warning: "#eab308",
      },
      fontFamily: {
        sans: ["BeVietnamPro-Regular"],
        medium: ["BeVietnamPro-Medium"],
        bold: ["BeVietnamPro-Bold"],
        semibold: ["BeVietnamPro-SemiBold"],
      },
    },
  },
  plugins: [],
};
