const { fontFamily } = require("tailwindcss/defaultTheme");

module.exports = {
  mode: "jit",
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter var", ...fontFamily.sans],
      },
      borderRadius: {
        card: "16px",
        button: "12px",
        input: "10px",
      },
      boxShadow: {
        card: "0 4px 20px rgba(0,0,0,0.25)",
        hover: "0 6px 30px rgba(0,0,0,0.35)",
        float: "0 10px 40px rgba(0,0,0,0.45)",
      },
      colors: {
        surface: {
          page: "#0B0C0E",
          card: "#121417",
          elevated: "#171A1F",
        },
        text: {
          primary: "#E6E8EB",
          secondary: "#A1A6AD",
          muted: "#6B7078",
        },
        accent: {
          DEFAULT: "#2BD97F",
          hover: "#25C46F",
          subtle: "rgba(43,217,127,0.12)",
        },
        status: {
          success: "#2BD97F",
          error: "#FF5C5C",
          warning: "#FFB020",
        },
        border: {
          DEFAULT: "rgba(255,255,255,0.08)",
          subtle: "rgba(255,255,255,0.04)",
        },
      },
      spacing: {
        "form-field": "16px",
        section: "32px",
      },
    },
  },
};
