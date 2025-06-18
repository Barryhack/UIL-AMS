const fs = require("fs")
const path = require("path")

// Check if package-lock.json exists
const packageLockPath = path.join(process.cwd(), "package-lock.json")
const yarnLockPath = path.join(process.cwd(), "yarn.lock")
const pnpmLockPath = path.join(process.cwd(), "pnpm-lock.yaml")

let lockFileExists = false

if (fs.existsSync(packageLockPath)) {
  lockFileExists = true
  console.log("Found package-lock.json")

  // Read package-lock.json
  const packageLock = JSON.parse(fs.readFileSync(packageLockPath, "utf8"))

  // Check if @swc/core and @swc/helpers are in dependencies
  let needsUpdate = false

  if (!packageLock.packages["node_modules/@swc/core"]) {
    console.log("@swc/core is missing, will be added")
    needsUpdate = true
  }

  if (!packageLock.packages["node_modules/@swc/helpers"]) {
    console.log("@swc/helpers is missing, will be added")
    needsUpdate = true
  }

  if (needsUpdate) {
    console.log("Running npm install to update dependencies...")
    const { execSync } = require("child_process")
    execSync("npm install", { stdio: "inherit" })
    console.log("Dependencies updated successfully")
  } else {
    console.log("SWC dependencies are already in package-lock.json")
  }
} else if (fs.existsSync(yarnLockPath)) {
  lockFileExists = true
  console.log("Found yarn.lock, running yarn to update dependencies...")
  const { execSync } = require("child_process")
  execSync("yarn", { stdio: "inherit" })
  console.log("Dependencies updated successfully")
} else if (fs.existsSync(pnpmLockPath)) {
  lockFileExists = true
  console.log("Found pnpm-lock.yaml, running pnpm install to update dependencies...")
  const { execSync } = require("child_process")
  execSync("pnpm install", { stdio: "inherit" })
  console.log("Dependencies updated successfully")
}

if (!lockFileExists) {
  console.log("No lockfile found. Running npm install to generate one...")
  const { execSync } = require("child_process")
  execSync("npm install", { stdio: "inherit" })
  console.log("Dependencies installed and lockfile generated")
}

console.log("SWC dependencies patch completed")
