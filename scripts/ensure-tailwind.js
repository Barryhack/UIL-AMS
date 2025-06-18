const { execSync } = require("child_process")
const fs = require("fs")
const path = require("path")

// Check if tailwindcss is installed
try {
  console.log("Checking for tailwindcss...")
  require.resolve("tailwindcss")
  console.log("tailwindcss is installed.")
} catch (e) {
  console.log("tailwindcss is not installed. Installing...")
  execSync("npm install tailwindcss postcss autoprefixer --no-save", { stdio: "inherit" })
  console.log("tailwindcss installed successfully.")
}

// Check if postcss.config.js exists
const postcssConfigPath = path.join(process.cwd(), "postcss.config.js")
if (!fs.existsSync(postcssConfigPath)) {
  console.log("postcss.config.js not found. Creating...")
  const postcssConfig = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`
  fs.writeFileSync(postcssConfigPath, postcssConfig)
  console.log("postcss.config.js created successfully.")
}

// Check if tailwind.config.js exists
const tailwindConfigPath = path.join(process.cwd(), "tailwind.config.js")
if (!fs.existsSync(tailwindConfigPath)) {
  console.log("tailwind.config.js not found. Creating...")
  const tailwindConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
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
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}`
  fs.writeFileSync(tailwindConfigPath, tailwindConfig)
  console.log("tailwind.config.js created successfully.")
}

console.log("All checks completed successfully.")
