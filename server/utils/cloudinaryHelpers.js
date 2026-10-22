import cloudinary from "../config/cloudinary.js";
import path from "path";
import { Readable } from "stream";

const bufferToStream = (buffer) => {
  const readable = new Readable();
  readable.push(buffer);
  readable.push(null);
  return readable;
};

const getResourceType = (filename) => {
  const ext = path.extname(filename).toLowerCase();

  const imageExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".pdf",
  ];

  const videoExtensions = [
    ".mp4",
    ".webm",
    ".mov",
    ".mp3",
    ".wav",
  ];

  if (imageExtensions.includes(ext)) return "image";
  if (videoExtensions.includes(ext)) return "video";

  return "raw";
};

export const uploadToCloudinary = (file, folder) => {
  return new Promise((resolve, reject) => {
    if (!file?.buffer || !file?.originalname) {
      return reject(new Error("Invalid file provided"));
    }

    const resourceType = getResourceType(file.originalname);

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `pravah/${folder}`,
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true,
        overwrite: false,
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        if (!result?.secure_url || !result?.public_id) {
          return reject(new Error("Cloudinary upload failed"));
        }

        resolve(result);
      },
    );

    bufferToStream(file.buffer).pipe(uploadStream);
  });
};

export const deleteFromCloudinary = async (
  publicId,
  resourceType = "raw",
) => {
  try {
    if (!publicId) return;

    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true,
    });
  } catch (error) {
    console.error("Cloudinary delete error:", error.message);
  }
};
