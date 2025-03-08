const fs = require("fs");
const path = require("path");
const { rmSync } = require("fs");

const jsdistDir = "jsdist";
const indexFile = "index.html";

// Clean up jsdist folder and index.html file
console.log("Cleaning up build artifacts...");

// Delete jsdist folder
try {
	if (fs.existsSync(jsdistDir)) {
		rmSync(jsdistDir, { recursive: true, force: true });
		console.log(`Deleted ${jsdistDir} folder`);
	} else {
		console.log(`${jsdistDir} folder not found, skipping`);
	}
} catch (err) {
	console.error(`Error deleting ${jsdistDir} folder:`, err);
}

// Delete index.html file
try {
	if (fs.existsSync(indexFile)) {
		fs.unlinkSync(indexFile);
		console.log(`Deleted ${indexFile} file`);
	} else {
		console.log(`${indexFile} file not found, skipping`);
	}
} catch (err) {
	console.error(`Error deleting ${indexFile} file:`, err);
}

