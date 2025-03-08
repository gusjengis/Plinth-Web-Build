const { execSync } = require("child_process");

function run(command) {
    console.log(`\nRunning: ${command}`);
    execSync(command, { stdio: "inherit" });
}

run("node prep-index.js vite");
run("vite build");
run("node prep-index.js trunk");
run("trunk build");
run("node generate-files.js");

console.log("\n✅ Build completed!");
