#!/usr/bin/env node

const { execSync } = require("child_process");
const path = require("path");

// Get the path to the build script inside the package
const buildScript = path.resolve(__dirname, "build.js");


try {
    execSync("watchexec --version", { stdio: "ignore" });
} catch (error) {
    console.error("\n❌ Error: `watchexec` is not installed. Install it with:");
    console.error("\n   cargo install watchexec-cli\n");
    process.exit(1);
}

execSync(
    `concurrently "watchexec -w . --ignore target --ignore dist --ignore jsdist -- node ${buildScript}" "live-server dist"`,
    { stdio: "inherit" }
);

