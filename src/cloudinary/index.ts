import cloudinary from "cloudinary";

// Use v2 directly from the main import
const cloudinaryV2 = cloudinary.v2;

const CLOUD_NAME = process.env.CLOUD_NAME!;
const CLOUD_KEY = process.env.CLOUD_KEY!;
const CLOUD_SECRET = process.env.CLOUD_SECRET!;

cloudinaryV2.config({
  cloud_name: CLOUD_NAME,
  api_key: CLOUD_KEY,
  api_secret: CLOUD_SECRET,
  secure: true,
});

const cloudinaryUploader = cloudinaryV2.uploader;

export const cloudinaryApi = cloudinaryV2.api;
export default cloudinaryUploader;
