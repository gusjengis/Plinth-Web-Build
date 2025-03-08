#!/usr/bin/env node

const { execSync } = require("child_process");

function run(command) {
    console.log(`\nRunning: ${command}`);
    execSync(command, { stdio: "inherit" });
}

const path = require("path");

const scriptsDir = path.resolve(__dirname, "./"); // Ensure the correct directory

run(`node ${path.join(scriptsDir, "prep-index.js")} vite`);
run(`vite build`);
run(`node ${path.join(scriptsDir, "prep-index.js")} trunk`);
run(`trunk build`);
run(`node ${path.join(scriptsDir, "generate-files.js")}`);
run(`node ${path.join(scriptsDir, "clean-files.js")}`);

console.log("\n✅ Build completed!");
