"use client";

import { useState, useRef } from "react";
import imageCompression from "browser-image-compression";
import { supabase } from "@/src/lib/supabase";
import { uploadOrderPhoto } from "@/src/lib/supabase-storage";

type PhotoUploadProps = {
  orderId: string;
  orderNumber: string;
  onPhotoAdded?: () => void;
};

export default function PhotoUpload({
  orderId,
  orderNumber,
  onPhotoAdded,
}: PhotoUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    setIsCompressing(true);
    setError("");

    try {
      // Compress image
      const options = {
        maxSizeMB: 0.5, // Max 500KB
        maxWidthOrHeight: 1920, // Max 1920px
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(selectedFile, options);

      setFile(compressedFile);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error("Compression error:", error);
      setError("Failed to compress image");
    } finally {
      setIsCompressing(false);
    }
  }

  async function handleUpload() {
  if (!file) {
    setError("Please select a file");
    return;
  }

  setIsUploading(true);
  setError("");

  try {
    // Step 1: Upload to storage
    const photoUrl = await uploadOrderPhoto(file, orderId);

    if (!photoUrl) {
      setError("Failed to upload photo");
      setIsUploading(false);
      return;
    }

    // Step 2: Save to database
    const { error: dbError } = await supabase.from("order_photos").insert([
      {
        order_id: orderId,
        photo_url: photoUrl,
        caption: caption || null,
        uploaded_at: new Date().toISOString(),
      },
    ]);

    if (dbError) {
      console.error("Database error:", dbError);
      setError(dbError.message || "Failed to save photo record");
      setIsUploading(false);
      return;
    }

    // Step 3: Delete old photo from storage (if exists)
    const { data: oldPhotos } = await supabase
      .from("order_photos")
      .select("photo_url")
      .eq("order_id", orderId)
      .order("uploaded_at", { ascending: false })
      .limit(2);  // Get the 2 newest (new one + old one)

    if (oldPhotos && oldPhotos.length > 1) {
      const oldPhotoUrl = oldPhotos[1].photo_url;  // Second newest is the old one
      const filename = oldPhotoUrl.split("/").pop();

      if (filename) {
        await supabase.storage
          .from("order-photos")
          .remove([filename]);
        
        console.log("Old photo deleted from storage");
      }
    }

    // Step 4: Success
    setFile(null);
    setPreview(null);
    setCaption("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    alert("Photo added successfully!");
    onPhotoAdded?.();
  } catch (error) {
    console.error("Upload error:", error);
    setError("Something went wrong");
  } finally {
    setIsUploading(false);
  }
}

  return (
    <div className="rounded-2xl border bg-white p-8">
      <h3 className="text-lg font-semibold text-zinc-900">
        Add Progress Photo
      </h3>
      <p className="mt-1 text-sm text-zinc-500">
        Share a photo of the work in progress with the customer.
      </p>

      {/* FILE INPUT */}
      <div className="mt-6">
        <label className="block">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={isCompressing}
            className="hidden"
          />
          <div className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 py-8 transition hover:border-zinc-400">
            {isCompressing ? (
              <div className="text-center">
                <p className="text-sm text-zinc-600">Compressing...</p>
              </div>
            ) : preview ? (
              <div className="text-center">
                <p className="text-xs text-zinc-500">Click to change</p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm text-zinc-600">Click to select image</p>
                <p className="text-xs text-zinc-400">
                  PNG, JPG, WebP (auto-compressed)
                </p>
              </div>
            )}
          </div>
        </label>
      </div>

      {/* PREVIEW */}
      {preview && (
        <div className="mt-4">
          <img
            src={preview}
            alt="Preview"
            className="max-h-48 w-full rounded-lg object-cover"
          />
          <p className="mt-2 text-xs text-zinc-400">
            File size: {(file?.size || 0) / 1024 > 1024 
              ? ((file?.size || 0) / 1024 / 1024).toFixed(2) + " MB"
              : ((file?.size || 0) / 1024).toFixed(2) + " KB"
            }
          </p>
        </div>
      )}

      {/* CAPTION */}
      <div className="mt-6">
        <label className="text-sm font-medium text-zinc-800">
          Caption (Optional)
        </label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="e.g., Just finished stitching the main body!"
          maxLength={150}
          className="mt-2 w-full rounded-lg border px-4 py-3 text-sm text-zinc-800 focus:border-zinc-400"
          rows={3}
        />
        <p className="mt-1 text-xs text-zinc-400">
          {caption.length}/150 characters
        </p>
      </div>

      {/* ERROR */}
      {error && (
        <div className="mt-4 rounded-lg bg-red-50 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* UPLOAD BUTTON */}
      <button
        onClick={handleUpload}
        disabled={!file || isUploading || isCompressing}
        className="mt-6 w-full rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50"
      >
        {isUploading ? "Uploading..." : "Add Photo"}
      </button>
      
    </div>
  );
}