const { execSync } = require("child_process")

console.log("Installing dependencies with legacy-peer-deps...")
execSync("npm install --legacy-peer-deps", { stdio: "inherit" })

console.log("Installing tailwindcss explicitly...")
execSync("npm install tailwindcss postcss autoprefixer --no-save", { stdio: "inherit" })

console.log("Installation completed successfully.")
