import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        portal: {
          ink: "#1f2937",
          muted: "#64748b",
          line: "#dbe4ee",
          canvas: "#f7fafc",
          panel: "#ffffff",
          sky: "#dbeafe",
          mint: "#d1fae5",
          peach: "#ffedd5",
          blue: "#2563eb",
          teal: "#0f766e"
        }
      },
      borderRadius: {
        portal: "8px"
      }
    }
  },
  plugins: []
};

export default config;
