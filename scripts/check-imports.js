const fs = require("fs")
const path = require("path")
const glob = require("glob")

// List of UI components we expect to have
const expectedComponents = ["alert", "badge", "button", "card", "input", "label", "table", "tabs"]

// Check if components exist
console.log("Checking if UI components exist...")
expectedComponents.forEach((component) => {
  const componentPath = path.join(__dirname, "..", "components", "ui", `${component}.tsx`)
  if (fs.existsSync(componentPath)) {
    console.log(`✅ ${component}.tsx exists`)
  } else {
    console.log(`❌ ${component}.tsx is missing`)
  }
})

// Find all imports of UI components
console.log("\nChecking imports in files...")
const files = glob.sync("**/*.{ts,tsx}", {
  ignore: ["node_modules/**", ".next/**", "out/**"],
  cwd: path.join(__dirname, ".."),
})

const importRegex = /@\/components\/ui\/([a-zA-Z-]+)/g
const imports = new Set()

files.forEach((file) => {
  const content = fs.readFileSync(path.join(__dirname, "..", file), "utf8")
  let match
  while ((match = importRegex.exec(content)) !== null) {
    imports.add(match[1])
  }
})

console.log("Imported UI components:")
imports.forEach((component) => {
  const componentPath = path.join(__dirname, "..", "components", "ui", `${component}.tsx`)
  if (fs.existsSync(componentPath)) {
    console.log(`✅ ${component} is imported and exists`)
  } else {
    console.log(`❌ ${component} is imported but missing`)
  }
})
