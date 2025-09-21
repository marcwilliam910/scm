const {v2: cloudinary} = require("cloudinary");

const CLOUD_NAME = process.env.CLOUD_NAME;
const CLOUD_KEY = process.env.CLOUD_KEY;
const CLOUD_SECRET = process.env.CLOUD_SECRET;

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: CLOUD_KEY,
  api_secret: CLOUD_SECRET,
  secure: true,
});

// Export using ES6 syntax to match your imports
export const cloudinaryApi = cloudinary.api;
export default cloudinary.uploader;
