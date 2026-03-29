const { TOKENS } = require("./src/constants/design-tokens");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: TOKENS.color.primary,
        brand: TOKENS.color.primary[500],
        "brand-dark": TOKENS.color.primary[700],
        gold: TOKENS.color.accent[500],
        accent: TOKENS.color.accent,
        ink: {
          DEFAULT: TOKENS.color.neutral[900],
          secondary: TOKENS.color.neutral[700],
          muted: TOKENS.color.neutral[400],
        },
        surface: TOKENS.color.surface.light,
        "surface-dark": TOKENS.color.surface.dark,
        background: TOKENS.color.background.light,
        "background-dark": TOKENS.color.background.dark,
        danger: {
          DEFAULT: TOKENS.color.error,
          bg: "#fee2e2",
          text: "#dc2626",
        },
        success: {
          DEFAULT: TOKENS.color.success,
          bg: "#dcfce7",
          text: "#16a34a",
        },
        warning: {
          DEFAULT: TOKENS.color.warning,
          bg: "#fef9c3",
          text: "#ca8a04",
        },
      },
      fontFamily: {
        sans: [TOKENS.font.body, "System"],
        medium: [TOKENS.font.medium, "System"],
        semibold: [TOKENS.font.semibold, "System"],
        bold: [TOKENS.font.heading, "System"],
      },
      borderRadius: {
        sm: `${TOKENS.radius.sm}px`,
        md: `${TOKENS.radius.md}px`,
        lg: `${TOKENS.radius.lg}px`,
        xl: `${TOKENS.radius.xl}px`,
        "2xl": `${TOKENS.radius["2xl"]}px`,
        "4xl": "2rem",
      },
      fontSize: {
        xs: [`${TOKENS.fontSize.xs}px`],
        sm: [`${TOKENS.fontSize.sm}px`],
        base: [`${TOKENS.fontSize.base}px`],
        md: [`${TOKENS.fontSize.md}px`],
        lg: [`${TOKENS.fontSize.lg}px`],
        xl: [`${TOKENS.fontSize.xl}px`],
        "2xl": [`${TOKENS.fontSize["2xl"]}px`],
        "3xl": [`${TOKENS.fontSize["3xl"]}px`],
      },
    },
  },
  darkMode: "media",
  plugins: [],
};
