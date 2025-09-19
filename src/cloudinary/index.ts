// cloudinary/index.ts

const cloudinary = require("cloudinary").v2;

// The SDK automatically uses the CLOUDINARY_URL environment variable.
// No need for cloudinary.config() here.

const cloudinaryUploader = cloudinary.uploader;

export const cloudinaryApi = cloudinary.api;
export default cloudinaryUploader;
