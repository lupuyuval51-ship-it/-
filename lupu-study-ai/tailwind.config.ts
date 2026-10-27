import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "1rem" },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        success: { DEFAULT: "hsl(var(--success))", foreground: "hsl(var(--success-foreground))" },
        warning: { DEFAULT: "hsl(var(--warning))", foreground: "hsl(var(--warning-foreground))" },
      },
      borderRadius: { lg: "1rem", md: "0.75rem", sm: "0.5rem", xl: "1.25rem", "2xl": "1.5rem" },
      boxShadow: {
        soft: "0 1px 2px hsl(var(--shadow) / 0.06), 0 8px 24px -8px hsl(var(--shadow) / 0.12)",
        glow: "0 0 0 1px hsl(var(--primary) / 0.25), 0 10px 40px -10px hsl(var(--primary) / 0.5)",
      },
      keyframes: {
        "fade-up": { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "none" } },
        pop: { "0%": { transform: "scale(0.6)", opacity: "0" }, "60%": { transform: "scale(1.15)" }, "100%": { transform: "scale(1)", opacity: "1" } },
        shimmer: { "100%": { transform: "translateX(-100%)" } },
      },
      animation: {
        "fade-up": "fade-up 0.35s ease-out both",
        pop: "pop 0.5s cubic-bezier(.2,.9,.3,1.3) both",
      },
    },
  },
  plugins: [animate],
};

export default config;
