/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        // Professional System Fonts - IBM Plex Sans based
        sans: ["IBM Plex Sans", "Inter", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "JetBrains Mono", "Fira Code", "monospace"],
        technical: ["IBM Plex Mono", "JetBrains Mono", "monospace"], // For technical/code text
        display: ["IBM Plex Sans", "Inter", "system-ui", "sans-serif"], // For main titles
        system: ["IBM Plex Mono", "JetBrains Mono", "monospace"], // For system labels
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // T.I.M Specific Palette extensions
        "tim-bg": "#F4F4F4",
        "tim-dark": "#1c1b1d",
        "tim-yellow": "#F3E600",
        "tim-gray": "#E0E0E0",
      },
      borderRadius: {
        lg: "var(--radius)", // 20px
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        // Custom T.I.M sharp/beveled styles are usually inline or clip-path based
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)",
        "grid-pattern-dark":
          "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
      },
      backgroundSize: {
        "grid-10": "10px 10px",
        "grid-20": "20px 20px",
      },
      boxShadow: {
        hard: "4px 4px 0 0 rgba(0,0,0,1)", // Retro/Industrial hard shadow
        "glow-yellow": "0 0 10px rgba(243, 230, 0, 0.5)",
      },
      // Custom transition durations for animate-ui sidebar
      transitionDuration: {
        400: "400ms",
      },
      // Custom easing functions for animate-ui
      transitionTimingFunction: {
        "sidebar-bounce": "cubic-bezier(0.7, -0.15, 0.25, 1.15)",
        "sidebar-smooth": "cubic-bezier(0.75, 0, 0.25, 1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
