const { execSync } = require("child_process")

console.log("Starting Vercel installation process...")

// Step 1: Install dependencies with --force
console.log("Step 1: Installing dependencies...")
try {
  execSync("npm install --force", { stdio: "inherit" })
  console.log("Dependencies installed successfully.")
} catch (error) {
  console.error("Failed to install dependencies:", error)
  process.exit(1)
}

// Step 2: Install Tailwind CSS explicitly
console.log("Step 2: Installing Tailwind CSS...")
try {
  execSync("npm install tailwindcss postcss autoprefixer --force", { stdio: "inherit" })
  console.log("Tailwind CSS installed successfully.")
} catch (error) {
  console.error("Failed to install Tailwind CSS:", error)
  process.exit(1)
}

console.log("Vercel installation process completed successfully.")
