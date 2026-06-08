import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        void: "#050711",
        panel: "#0d1224",
        cyanNeon: "#35f7ff",
        pinkNeon: "#ff4fd8",
        limeNeon: "#b5ff4d"
      },
      boxShadow: {
        glow: "0 0 40px rgba(53,247,255,0.25)",
        pixel: "0 0 0 1px rgba(255,255,255,0.08), 0 18px 60px rgba(0,0,0,0.45)"
      },
      backgroundImage: {
        grid: "linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)",
        aurora: "radial-gradient(circle at 20% 20%, rgba(53,247,255,.22), transparent 32%), radial-gradient(circle at 80% 10%, rgba(255,79,216,.20), transparent 34%), radial-gradient(circle at 50% 80%, rgba(181,255,77,.12), transparent 28%)"
      }
    }
  },
  plugins: []
};

export default config;
