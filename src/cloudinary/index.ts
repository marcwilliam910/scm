console.log("=== CLOUDINARY DEBUG ===");
console.log("Node version:", process.version);
console.log("Current working directory:", process.cwd());

// Check if cloudinary is installed
const fs = require("fs");
const path = require("path");

// Check different possible locations
const possiblePaths = [
  path.join(process.cwd(), "node_modules", "cloudinary"),
  path.join(__dirname, "..", "node_modules", "cloudinary"),
  path.join(__dirname, "..", "..", "node_modules", "cloudinary"),
];

possiblePaths.forEach((p, index) => {
  console.log(`Path ${index + 1}: ${p}`);
  console.log(`Exists: ${fs.existsSync(p)}`);
});

// List all packages in node_modules
const nodeModulesPath = path.join(process.cwd(), "node_modules");
if (fs.existsSync(nodeModulesPath)) {
  const packages = fs.readdirSync(nodeModulesPath);
  console.log("Total packages:", packages.length);
  console.log("Has cloudinary:", packages.includes("cloudinary"));
  console.log(
    'Packages containing "cloud":',
    packages.filter((p: any) => p.includes("cloud"))
  );
}

// Default exports in case of failure
let cloudinaryUploader: any = {};
let cloudinaryApi: any = {};

// Try to require it
try {
  console.log("Attempting to require cloudinary...");
  const cloudinary = require("cloudinary");
  console.log("Cloudinary loaded successfully");
  console.log("Cloudinary keys:", Object.keys(cloudinary || {}));
  console.log("Type of cloudinary:", typeof cloudinary);

  if (cloudinary && cloudinary.v2) {
    console.log("V2 found, configuring...");
    cloudinary.v2.config({
      cloud_name: process.env.CLOUD_NAME,
      api_key: process.env.CLOUD_KEY,
      api_secret: process.env.CLOUD_SECRET,
      secure: true,
    });

    console.log("Export successful");
    cloudinaryUploader = cloudinary.v2.uploader;
    cloudinaryApi = cloudinary.v2.api;
  } else {
    console.error("Cloudinary loaded but v2 not found");
    console.error("Cloudinary structure:", JSON.stringify(cloudinary, null, 2));
    throw new Error("v2 not found in cloudinary module");
  }
} catch (error: any) {
  console.error("Cloudinary require failed:", error.message);
  console.error("Stack:", error.stack);
}

// ES6 exports to match your imports
export {cloudinaryApi};
export default cloudinaryUploader;
