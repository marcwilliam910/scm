let cloudinary: any;

try {
  cloudinary = require("cloudinary").v2;
} catch (error) {
  console.log("Cloudinary not available:", error);
  cloudinary = null;
}

const CLOUD_NAME = process.env.CLOUD_NAME!;
const CLOUD_KEY = process.env.CLOUD_KEY!;
const CLOUD_SECRET = process.env.CLOUD_SECRET!;

if (cloudinary) {
  cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: CLOUD_KEY,
    api_secret: CLOUD_SECRET,
    secure: true,
  });
}

const cloudinaryUploader = cloudinary?.uploader;

export const cloudinaryApi = cloudinary?.api;
export default cloudinaryUploader;
