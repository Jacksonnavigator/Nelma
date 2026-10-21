/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#071E24", 800: "#0B2A31", 700: "#123A42" },
        teal: { DEFAULT: "#0E6F73", 600: "#0E6F73", 500: "#14878A", 300: "#3FB8AF", 100: "#D6EEEC", 50: "#EEF7F6" },
        solar: { DEFAULT: "#F7931E", 600: "#E07C0A", 400: "#FFAE4D", 100: "#FFF1DF" },
        paper: "#F7FAF9",
        slate: { 600: "#4B5F63", 500: "#677A7E", 200: "#D8E2E2" },
      },
      fontFamily: {
        display: ['"Fraunces"', "Georgia", "serif"],
        sans: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
      },
      maxWidth: { site: "1240px" },
      boxShadow: {
        card: "0 1px 2px rgba(7,30,36,.06), 0 12px 32px -12px rgba(7,30,36,.18)",
        lift: "0 2px 4px rgba(7,30,36,.06), 0 24px 48px -16px rgba(7,30,36,.28)",
      },
      keyframes: {
        kenburns: { "0%": { transform: "scale(1)" }, "100%": { transform: "scale(1.12)" } },
        progress: { "0%": { transform: "scaleX(0)" }, "100%": { transform: "scaleX(1)" } },
        rise: { "0%": { opacity: "0", transform: "translateY(24px)" }, "100%": { opacity: "1", transform: "none" } },
        marquee: { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(-50%)" } },
      },
      animation: {
        kenburns: "kenburns 9s ease-out forwards",
        progress: "progress 7s linear forwards",
        rise: "rise .9s cubic-bezier(.2,.7,.2,1) both",
        marquee: "marquee 40s linear infinite",
      },
    },
  },
  plugins: [],
};
