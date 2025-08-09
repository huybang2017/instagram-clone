"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { X, Image as ImageIcon } from "lucide-react";
import { useSession } from "next-auth/react";

import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Avatar } from "~/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogTitle,
} from "~/components/ui/dialog";
import { api } from "~/trpc/react";
import { uploadImage } from "~/lib/cloudinary";

interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatePostModal({ open, onOpenChange }: CreatePostModalProps) {
  const router = useRouter();
  const session = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<"select" | "edit">("select");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Reset the form when the modal is closed
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  // Cleanup preview URLs when component unmounts
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    const newFiles = Array.from(e.target.files);
    setSelectedFiles((prev) => [...prev, ...newFiles]);

    // Create preview URLs for selected images
    const newPreviewUrls = newFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls((prev) => [...prev, ...newPreviewUrls]);

    // Move to edit step after selecting files
    setStep("edit");
  };

  // Handle remove selected image
  const handleRemoveImage = (index: number) => {
    setSelectedFiles((prev) => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });

    // Also remove the preview URL and revoke it
    setPreviewUrls((prev) => {
      const urlToRevoke = prev[index] ?? "";
      URL.revokeObjectURL(urlToRevoke);

      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });

    // If no images left, go back to select step
    if (selectedFiles.length === 1) {
      setStep("select");
    }
  };

  const { mutate: createPost, isPending } = api.post.create.useMutation({
    onSuccess: () => {
      console.log("Post created successfully!");
      resetForm();
      onOpenChange(false);
      router.refresh();
    },
    onError: (error) => {
      console.error("Post creation error:", error);
      setUploadError(`Error: ${error.message}`);
      setIsUploading(false);
    },
  });

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (selectedFiles.length === 0) {
      setUploadError("Please upload at least one image");
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);

      // Upload all selected files to Cloudinary
      const uploadPromises = selectedFiles.map((file) => uploadImage(file));
      const uploadedImages = await Promise.all(uploadPromises);

      // Create post with uploaded images
      createPost({
        caption: caption || undefined,
        location: undefined,
        images: uploadedImages.map((img) => ({
          url: img.url,
          cloudinaryId: img.publicId,
        })),
      });
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      setUploadError("An unexpected error occurred. Please try again.");
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    // Revoke all object URLs to prevent memory leaks
    previewUrls.forEach((url) => URL.revokeObjectURL(url));

    setSelectedFiles([]);
    setPreviewUrls([]);
    setCaption("");
    setUploadError(null);
    setIsUploading(false);
    setStep("select");
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
  };

  const handleGoBack = () => {
    setStep("select");

    // Revoke all object URLs to prevent memory leaks
    previewUrls.forEach((url) => URL.revokeObjectURL(url));

    setSelectedFiles([]);
    setPreviewUrls([]);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-h-[90vh] max-w-[90vw] overflow-hidden rounded-xl bg-neutral-900 p-0 shadow-2xl md:max-w-[80vw] lg:max-w-[1100px]"
        showCloseButton={false}
      >
        {/* Modal header with responsive title */}
        <div className="relative border-b border-neutral-800 bg-black py-3 text-center">
          <DialogTitle className="text-base font-semibold text-white">
            {step === "select" ? "Tạo bài đăng mới" : "Tạo bài đăng mới"}
          </DialogTitle>

          {step === "edit" && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 left-3 text-white hover:bg-white/10"
              onClick={handleGoBack}
            >
              <X size={20} />
            </Button>
          )}

          {step === "edit" && (
            <Button
              variant="ghost"
              className="absolute top-2 right-3 font-semibold text-blue-500 hover:bg-transparent hover:text-blue-400"
              onClick={handleSubmit}
              disabled={isPending || isUploading}
            >
              {isPending || isUploading ? "Đang đăng..." : "Đăng"}
            </Button>
          )}

          {step === "select" && (
            <DialogClose className="absolute top-2.5 right-3 rounded-full p-1 text-white hover:bg-white/10">
              <X size={20} />
            </DialogClose>
          )}
        </div>

        {/* Modal content - No background color here, let children control it */}
        <div className="flex max-h-[90vh] flex-col md:flex-row">
          {/* Image selection step */}
          {step === "select" && (
            <div className="flex aspect-square w-full items-center justify-center bg-neutral-900 md:min-w-[500px] lg:min-w-[600px]">
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="mb-6">
                  <ImageIcon size={80} className="text-neutral-300" />
                </div>
                <p className="mb-6 text-2xl font-light text-white">
                  Kéo thả hoặc chọn ảnh để tải lên
                </p>

                {/* File input for selecting images */}
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
                  className="bg-indigo-500 font-bold text-white hover:bg-indigo-600"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Chọn ảnh từ thiết bị
                </Button>

                {uploadError && (
                  <p className="mt-4 text-sm text-red-500">{uploadError}</p>
                )}
              </div>
            </div>
          )}

          {/* Edit post step */}
          {step === "edit" && (
            <>
              {/* Image preview */}
              <div className="flex h-[500px] w-full items-center justify-center bg-white md:h-[600px] md:w-3/5 lg:h-[700px]">
                {previewUrls.length > 0 && (
                  <div className="relative h-full w-full bg-neutral-900">
                    {/* Hiển thị ảnh đầu tiên làm preview chính */}
                    <Image
                      src={previewUrls[0] ?? ""}
                      alt="Preview"
                      fill
                      className="object-contain"
                      priority
                    />

                    {/* Hiển thị thumbnails cho nhiều ảnh */}
                    {previewUrls.length > 1 && (
                      <div className="absolute right-0 bottom-4 left-0 flex justify-center gap-2 px-4">
                        {previewUrls.map((url, index) => (
                          <div
                            key={index}
                            className={`group relative h-16 w-16 cursor-pointer rounded-md border-2 ${
                              index === 0
                                ? "border-blue-500"
                                : "border-transparent"
                            }`}
                          >
                            <Image
                              src={url}
                              alt={`Image ${index + 1}`}
                              width={64}
                              height={64}
                              className="h-full w-full rounded-md object-cover"
                            />

                            {/* Remove image button */}
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              className="absolute top-0 right-0 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Post details */}
              <div className="flex h-full w-full flex-col border-l bg-neutral-950 md:w-2/5">
                {/* User info */}
                <div className="flex items-center gap-3 bg-neutral-900 p-4">
                  <Avatar className="h-8 w-8">
                    <Image
                      src={session.data?.user?.image ?? "/default-avatar.png"}
                      alt={session.data?.user?.name ?? "User"}
                      width={32}
                      height={32}
                    />
                  </Avatar>
                  <p className="font-semibold">
                    {session.data?.user?.name ?? "User"}
                  </p>
                </div>

                {/* Caption textarea */}
                <div className="bg-neutrall-900 flex-grow p-4">
                  <Textarea
                    placeholder="Viết mô tả bài đăng..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="min-h-[200px] resize-none border-0 bg-transparent text-base text-white placeholder:text-neutral-500 focus-visible:ring-0"
                    disabled={isPending || isUploading}
                  />
                </div>

                {/* Mobile share button (visible on small screens) */}
                <div className="border-t bg-neutral-900 p-4 md:hidden">
                  <Button
                    onClick={handleSubmit}
                    className="w-full rounded-lg bg-blue-500 font-semibold hover:bg-blue-600"
                    disabled={isPending || isUploading}
                  >
                    {isPending || isUploading ? "Đang đăng..." : "Đăng"}
                  </Button>
                </div>

                {/* Loading indicator */}
                {isUploading && (
                  <div className="border-t bg-neutral-900 p-4">
                    <p className="text-sm text-white">
                      Đang tải ảnh lên... Vui lòng đợi trong giây lát.
                    </p>
                  </div>
                )}

                {/* Error message */}
                {uploadError && (
                  <div className="border-t bg-white p-4">
                    <p className="text-sm text-red-500">{uploadError}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
