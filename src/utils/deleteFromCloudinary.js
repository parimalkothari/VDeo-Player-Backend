import { v2 as cloudinary } from "cloudinary";

const deleteFromCloudinary = async (cloudinaryPath) => {
  // Configuration
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET, // Click 'View API Keys' above to copy your API secret
  });

  try {
    if (!cloudinaryPath) {
      return null;
    }
    const publicId = cloudinaryPath.split("/").pop().split(".")[0];
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.log(500, "something went wrong while deleting the file");
  }
};

export default deleteFromCloudinary;
