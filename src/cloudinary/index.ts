console.log("=== CLOUDINARY MODULE DEBUG ===");

// Check what require actually returns
let cloudinaryModule;
try {
  cloudinaryModule = require("cloudinary");
  console.log("require('cloudinary') returned:", typeof cloudinaryModule);
  console.log("cloudinary keys:", Object.keys(cloudinaryModule || {}));
  console.log(
    "cloudinary stringified:",
    JSON.stringify(cloudinaryModule, null, 2)
  );
} catch (error: any) {
  console.error("require('cloudinary') failed:", error.message);
}

// Try alternative requires
try {
  const alt1 = require("cloudinary/lib/cloudinary");
  console.log("Alternative require 1 worked:", !!alt1);
} catch (e: any) {
  console.log("Alt require 1 failed:", e.message);
}

try {
  const alt2 = require("cloudinary/lib/v2");
  console.log("Alternative require 2 worked:", !!alt2);
} catch (e: any) {
  console.log("Alt require 2 failed:", e.message);
}

// Fallback exports
const cloudinaryUploader = {};
const cloudinaryApi = {};

export {cloudinaryApi};
export default cloudinaryUploader;
