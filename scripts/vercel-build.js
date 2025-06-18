const { execSync } = require("child_process")

console.log("Starting Vercel build process...")

// Step 1: Install Tailwind CSS
console.log("Step 1: Installing Tailwind CSS...")
try {
  execSync("npm install tailwindcss postcss autoprefixer --force", { stdio: "inherit" })
  console.log("Tailwind CSS installed successfully.")
} catch (error) {
  console.error("Failed to install Tailwind CSS:", error)
  process.exit(1)
}

// Step 2: Generate Prisma client
console.log("Step 2: Generating Prisma client...")
try {
  execSync("npx prisma generate", { stdio: "inherit" })
  console.log("Prisma client generated successfully.")
} catch (error) {
  console.error("Failed to generate Prisma client:", error)
  process.exit(1)
}

// Step 3: Build Next.js application
console.log("Step 3: Building Next.js application...")
try {
  execSync("next build", { stdio: "inherit" })
  console.log("Next.js application built successfully.")
} catch (error) {
  console.error("Failed to build Next.js application:", error)
  process.exit(1)
}

console.log("Vercel build process completed successfully.")
