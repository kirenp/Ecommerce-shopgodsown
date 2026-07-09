import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        luxury: {
          black: "#000000",
          dark: "#0a0a0a",
          gold: "#d4af37",
          kasavu: "#e5c453",
          white: "#ffffff",
          offwhite: "#f5f5f5",
        },
        temple: {
          stone: "#2B1D14",
          bronze: "#8D5C2D",
          gold: "#D4AF37",
          amber: "#E89C3D",
          ivory: "#F5F0E6",
          dark: "#120D08",
          "deep-brown": "#1A1008",
          "warm-black": "#0D0906",
        },
      },
      fontFamily: {
        luxury: ["var(--font-inter)", "sans-serif"],
        brand: ["var(--font-cormorant)", "serif"],
        geishta: ["var(--font-geishta)", "sans-serif"],
        pickyside: ["var(--font-pickyside)", "sans-serif"],
      },
      animation: {
        marquee: "marquee 25s linear infinite",
        shimmer: "shimmer 2s linear infinite",
        float: "float 6s ease-in-out infinite",
        glow: "glow 3s ease-in-out infinite",
        "fade-in-up": "fadeInUp 1s ease-out forwards",
        "pulse-gold": "pulseGold 2s ease-in-out infinite",
        "fade-in": "fadeIn 1s ease-out forwards",
        "slow-zoom": "slowZoom 20s ease-out forwards",
        "slide-in-left": "slideInLeft 0.35s cubic-bezier(0.16,1,0.3,1) forwards",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        glow: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slowZoom: {
          "0%": { transform: "scale(1)" },
          "100%": { transform: "scale(1.02)" },
        },
        slideInLeft: {
          "0%": { transform: "translateX(-100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        pulseGold: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(212, 175, 55, 0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(212, 175, 55, 0.6)" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
export default config;
