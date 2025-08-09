"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import type { ChangeEvent } from "react";
import { Button } from "~/components/ui/button";
import { useSession } from "next-auth/react";
import { uploadImage } from "~/lib/cloudinary";

export interface UploadedImage {
  url: string;
  publicId: string;
}

interface ImageUploaderProps {
  onImagesUploaded: (images: UploadedImage[]) => void;
  className?: string;
}

export function ImageUploader({
  onImagesUploaded,
  className = "",
}: ImageUploaderProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: session } = useSession();

  // Xử lý khi người dùng chọn file
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    const newFiles = Array.from(e.target.files);
    setSelectedFiles((prev) => [...prev, ...newFiles]);

    // Tạo preview URLs cho các ảnh đã chọn
    const newPreviewUrls = newFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls((prev) => [...prev, ...newPreviewUrls]);
  };

  // Xử lý upload ảnh lên Cloudinary
  const handleUpload = async () => {
    if (!selectedFiles.length) return;

    try {
      setIsUploading(true);

      // Upload mỗi ảnh lên Cloudinary và thu thập URL
      const uploadPromises = selectedFiles.map((file) => uploadImage(file));
      const results = await Promise.all(uploadPromises);

      // Gọi callback với kết quả đã upload (bao gồm url và publicId)
      onImagesUploaded(results);

      // Reset state
      setSelectedFiles([]);
      setPreviewUrls([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error uploading images to Cloudinary:", error);
      alert("Đã xảy ra lỗi khi tải ảnh lên. Vui lòng thử lại.");
    } finally {
      setIsUploading(false);
    }
  };

  // Xử lý xóa một ảnh đã chọn
  const handleRemoveImage = (index: number) => {
    // Xóa file khỏi danh sách
    setSelectedFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));

    // Xóa preview URL và giải phóng bộ nhớ
    const urlToRemove = previewUrls[index] ?? "";
    setPreviewUrls((prevUrls) => prevUrls.filter((_, i) => i !== index));
    URL.revokeObjectURL(urlToRemove);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Preview ảnh */}
      {previewUrls.length > 0 && (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {previewUrls.map((url, index) => (
            <div key={index} className="group relative">
              <Image
                src={url}
                alt={`Preview ${index}`}
                className="h-32 w-full rounded-md object-cover"
                width={128}
                height={128}
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="absolute top-1 right-1 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input chọn file và nút upload */}
      <div className="flex items-center gap-4">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          multiple
          className="hidden"
          id="image-upload"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          Chọn ảnh
        </Button>

        {selectedFiles.length > 0 && (
          <Button type="button" onClick={handleUpload} disabled={isUploading}>
            {isUploading
              ? "Đang tải lên..."
              : `Tải lên ${selectedFiles.length} ảnh`}
          </Button>
        )}
      </div>

      {/* Hiển thị số lượng ảnh đã chọn */}
      {selectedFiles.length > 0 && (
        <p className="text-sm text-gray-500">
          Đã chọn {selectedFiles.length} ảnh
        </p>
      )}
    </div>
  );
}
