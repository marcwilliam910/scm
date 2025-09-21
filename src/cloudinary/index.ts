const cloudinaryModule = require("cloudinary");
const cloudinary = cloudinaryModule?.v2 || cloudinaryModule;

console.log("Cloudinary keys:", Object.keys(cloudinary));
const CLOUD_NAME = process.env.CLOUD_NAME || "";
const CLOUD_KEY = process.env.CLOUD_KEY || "";
const CLOUD_SECRET = process.env.CLOUD_SECRET || "";

if (!CLOUD_NAME || !CLOUD_KEY || !CLOUD_SECRET) {
  throw new Error("Missing Cloudinary environment variables");
}

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: CLOUD_KEY,
  api_secret: CLOUD_SECRET,
  secure: true,
});

const cloudinaryUploader = cloudinary?.uploader;

export const cloudinaryApi = cloudinary?.api;
export default cloudinaryUploader;
