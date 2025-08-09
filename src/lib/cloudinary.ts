"use client";

// For frontend/client-side Cloudinary operations using their SDK
import { Cloudinary } from "@cloudinary/url-gen";

// Initialize the Cloudinary configuration for frontend
const cld = new Cloudinary({
  cloud: {
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  },
  url: {
    secure: true,
  },
});

// Type for upload result
export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
}

// Upload an image directly to Cloudinary from the browser
export async function uploadImage(file: File): Promise<CloudinaryUploadResult> {
  // Create a FormData instance
  const formData = new FormData();
  formData.append("file", file);
  formData.append(
    "upload_preset",
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "instagram-clone",
  );

  // Upload to Cloudinary using their upload API
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  if (!response.ok) {
    // Parse error response
    const errorData = await response.json();
    console.error("Cloudinary upload error:", errorData);

    if (
      errorData.error?.message?.includes("Upload preset must be whitelisted")
    ) {
      throw new Error(
        "Cloudinary upload preset not properly configured. Please ensure your upload preset is set to 'Unsigned' in the Cloudinary dashboard.",
      );
    }

    throw new Error(
      errorData.error?.message || "Failed to upload image to Cloudinary",
    );
  }

  const data = await response.json();

  return {
    url: data.secure_url,
    publicId: data.public_id,
  };
}

// Upload multiple images to Cloudinary
export async function uploadMultipleImages(
  files: File[],
): Promise<CloudinaryUploadResult[]> {
  const uploadPromises = files.map((file) => uploadImage(file));
  return Promise.all(uploadPromises);
}

// Get Cloudinary configuration
export function getCloudinaryConfig() {
  return {
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  };
}

export { cld };
