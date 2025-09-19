// Try direct require without destructuring
const cloudinary = require("cloudinary");

const CLOUD_NAME = process.env.CLOUD_NAME!;
const CLOUD_KEY = process.env.CLOUD_KEY!;
const CLOUD_SECRET = process.env.CLOUD_SECRET!;

// Access v2 after requiring
cloudinary.v2.config({
  cloud_name: CLOUD_NAME,
  api_key: CLOUD_KEY,
  api_secret: CLOUD_SECRET,
  secure: true,
});

const cloudinaryUploader = cloudinary.v2.uploader;

export const cloudinaryApi = cloudinary.v2.api;
export default cloudinaryUploader;
