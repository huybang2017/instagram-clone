import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { uploadImage, uploadMultipleImages } from "./cloudinary";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function add24Hours(date: Date): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + 24);
  return result;
}

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds} giây trước`;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} phút trước`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} giờ trước`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} ngày trước`;
  }

  return date.toLocaleDateString("vi-VN");
}

// Cloudinary utilities

/**
 * Upload một file ảnh lên Cloudinary
 * @param file - File ảnh để upload
 * @returns Object chứa URL và publicId của ảnh đã upload
 */
export async function uploadImageToCloudinary(file: File) {
  try {
    return await uploadImage(file);
  } catch (error) {
    console.error("Error uploading image to Cloudinary:", error);
    throw new Error("Failed to upload image");
  }
}

/**
 * Upload nhiều file ảnh lên Cloudinary
 * @param files - Mảng các file ảnh để upload
 * @returns Mảng các URL của ảnh đã upload
 */
export async function uploadMultipleImagesToCloudinary(
  files: File[],
): Promise<string[]> {
  try {
    const results = await uploadMultipleImages(files);
    return results.map((result) => result.url);
  } catch (error) {
    console.error("Error uploading multiple images to Cloudinary:", error);
    throw new Error("Failed to upload images");
  }
}

/**
 * Extract Cloudinary public ID from URL
 * @param url - Cloudinary URL
 * @returns Public ID or null if not a valid Cloudinary URL
 */
export function getCloudinaryPublicId(url: string): string | null {
  try {
    // Expected format: https://res.cloudinary.com/cloud-name/image/upload/v1234567890/instagram-clone/abcdef123456
    const regex = /\/v\d+\/([^/]+\/[^/]+)$/;
    const match = url.match(regex);
    return match ? match[1] : null;
  } catch (error) {
    console.error("Error extracting Cloudinary public ID:", error);
    return null;
  }
}
