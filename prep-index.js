const fs = require("fs");
const path = require("path");

// Get the build mode from command line arguments
const mode = process.argv[2]; // Expected: "vite" or "trunk"
const outputFile = "./index.html";
const srcDir = "./src";

// Function to find the index.html file in the src directory
function findIndexHtml(dir) {
    let result = null;
    
    function search(currentDir) {
        const files = fs.readdirSync(currentDir);
        
        for (const file of files) {
            const filePath = path.join(currentDir, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory()) {
                const found = search(filePath);
                if (found) return found;
            } else if (file === "index.html") {
                return filePath;
            }
        }
        return null;
    }
    
    return search(dir);
}

// Find the input file or use provided one
const inputFile = process.argv[3] || findIndexHtml(srcDir);
console.log(`ℹ️ Using template file: ${inputFile}`);

// Extract crate name from Cargo.toml
function getCrateName() {
    try {
        const cargoToml = fs.readFileSync("./Cargo.toml", "utf8");
        const match = cargoToml.match(/name\s*=\s*"([^"]+)"/);
        return match ? match[1] : "unknown-crate";
    } catch (error) {
        console.warn("⚠️ Could not read Cargo.toml, using default crate name");
        return "unknown-crate";
    }
}

// Function to recursively find all .tsx files in a directory
function findTsxFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            findTsxFiles(filePath, fileList);
        } else if (file.endsWith('.tsx')) {
            // Convert absolute path to relative path from project root
            const relativePath = `./${path.relative('.', filePath).replace(/\\/g, '/')}`;
            fileList.push(relativePath);
        }
    });
    
    return fileList;
}

// The asset loading script to be inserted in trunk mode
const assetLoadingScript = `
<script>
    fetch("./files.json")  // ✅ Fetch the list of JS and CSS files
        .then(response => response.json())
        .then(data => {
            // Load JavaScript files
            if (data.scripts && Array.isArray(data.scripts)) {
                data.scripts.forEach(file => {
                    if (file.endsWith(".js")) {  // ✅ Ensure it's a JS file
                        const scriptTag = document.createElement("script");
                        scriptTag.src = \`./assets/\${file}\`;
                        document.body.appendChild(scriptTag);
                    }
                });
            } else {
                console.error("Invalid JSON format: Expected an array under \`scripts\` key.");
            }

            // Load CSS files
            if (data.styles && Array.isArray(data.styles)) {
                data.styles.forEach(file => {
                    if (file.endsWith(".css")) {  // ✅ Ensure it's a CSS file
                        const linkTag = document.createElement("link");
                        linkTag.rel = "stylesheet";
                        linkTag.href = \`./assets/\${file}\`;
                        document.head.appendChild(linkTag);  // CSS goes in the head
                    }
                });
            } else {
                console.warn("No CSS files found in the JSON.");
            }
        })
        .catch(error => console.error("Error loading assets:", error));
</script>
`;

// The trunk links template with CRATE_NAME placeholder
const trunkLinksTemplate = `
<link data-trunk rel="rust" data-bin="CRATE_NAME" />
<link data-trunk rel="copy-dir" href="jsdist/assets" />
`;

try {
    // Read the source HTML file
    let content = fs.readFileSync(inputFile, "utf8");
    
    if (mode === "vite") {
        // Find all .tsx files in the entire src directory
        const tsxFiles = findTsxFiles(srcDir)
            .map(filePath => `<script type="module" src="${filePath}"></script>`)
            .join("\n");
            
        // Insert the TSX script tags into the body
        content = content.replace(/<body>([\s\S]*?)<\/body>/m, function(match, bodyContent) {
            return `<body>${bodyContent}\n${tsxFiles}\n</body>`;
        });
        
        // Remove any trunk-specific content
        content = content.replace(/<!-- TRUNK_START -->[\s\S]*?<!-- TRUNK_END -->/g, "");
        
        console.log(`✅ Generated index.html for Vite with ${tsxFiles.split('\n').length} TSX files.`);
    } else if (mode === "trunk") {
        // Get the crate name
        const crateName = getCrateName();
        console.log(`ℹ️ Using crate name: ${crateName}`);
        
        // Insert the trunk links into the head
        const trunkLinks = trunkLinksTemplate.replace(/CRATE_NAME/g, crateName);
        content = content.replace(/<head>([\s\S]*?)<\/head>/m, function(match, headContent) {
            return `<head>${headContent}\n${trunkLinks}\n</head>`;
        });
        
        // Insert the asset loading script into the body
        content = content.replace(/<body>([\s\S]*?)<\/body>/m, function(match, bodyContent) {
            return `<body>${bodyContent}\n${assetLoadingScript}\n</body>`;
        });
        
        console.log("✅ Generated index.html for Trunk.");
    }
    
    // Write the modified content to index.html
    fs.writeFileSync(outputFile, content, "utf8");
    console.log(`✅ Successfully wrote to ${outputFile}`);
} catch (error) {
    console.error("❌ Error processing index.html:", error);
    process.exit(1);
}
