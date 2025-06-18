const { execSync } = require("child_process")
const fs = require("fs")
const path = require("path")

console.log("Installing Tailwind CSS...")

// Force install tailwindcss and its dependencies
try {
  execSync("npm install tailwindcss postcss autoprefixer --force", { stdio: "inherit" })
  console.log("Tailwind CSS installed successfully.")
} catch (error) {
  console.error("Failed to install Tailwind CSS:", error)
  process.exit(1)
}

// Create a minimal tailwind.config.js if it doesn't exist
const tailwindConfigPath = path.join(process.cwd(), "tailwind.config.js")
if (!fs.existsSync(tailwindConfigPath)) {
  console.log("Creating tailwind.config.js...")
  const tailwindConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`
  fs.writeFileSync(tailwindConfigPath, tailwindConfig)
  console.log("tailwind.config.js created successfully.")
}

// Create a minimal postcss.config.js if it doesn't exist
const postcssConfigPath = path.join(process.cwd(), "postcss.config.js")
if (!fs.existsSync(postcssConfigPath)) {
  console.log("Creating postcss.config.js...")
  const postcssConfig = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`
  fs.writeFileSync(postcssConfigPath, postcssConfig)
  console.log("postcss.config.js created successfully.")
}

console.log("Tailwind CSS setup completed successfully.")
