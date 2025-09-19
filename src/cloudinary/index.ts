import {v2 as cloudinary} from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET,
  secure: true,
});

export const cloudinaryUploader = cloudinary.uploader;
export const cloudinaryApi = cloudinary.api;
export default cloudinaryUploader;
