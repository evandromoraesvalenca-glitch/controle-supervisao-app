import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        linha: {
          orange: "#f47b20",
          blue: "#0b1f3a",
          steel: "#e9edf3",
          ink: "#172033"
        }
      },
      boxShadow: {
        panel: "0 14px 35px rgba(11, 31, 58, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;
