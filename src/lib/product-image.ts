import { supabase } from "@/src/lib/supabase";

const MAX_DIMENSION = 1600;
const WEBP_QUALITY = 0.82;
const PRODUCT_IMAGE_BUCKET = "product-images";

export type ProductImageResult = {
  url: string;
  originalBytes: number;
  uploadedBytes: number;
};

function loadBrowserImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not open this image."));
    };

    image.src = objectUrl;
  });
}

export async function compressProductImage(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }

  const image = await loadBrowserImage(file);

  const originalWidth = image.naturalWidth;
  const originalHeight = image.naturalHeight;

  if (!originalWidth || !originalHeight) {
    throw new Error("The image has invalid dimensions.");
  }

  const largestSide = Math.max(originalWidth, originalHeight);
  const scale =
    largestSide > MAX_DIMENSION
      ? MAX_DIMENSION / largestSide
      : 1;

  const width = Math.max(1, Math.round(originalWidth * scale));
  const height = Math.max(1, Math.round(originalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not prepare the image.");
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/webp", WEBP_QUALITY);
  });

  if (!blob) {
    throw new Error("Could not convert the image to WebP.");
  }

  return blob;
}

export async function uploadProductImage(
  productId: string,
  file: File
): Promise<ProductImageResult> {
  const compressed = await compressProductImage(file);
  const storagePath = `${productId}/cover.webp`;

  const { error: uploadError } = await supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .upload(storagePath, compressed, {
      contentType: "image/webp",
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    throw uploadError;
  }

  const {
    data: { publicUrl },
  } = supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .getPublicUrl(storagePath);

  return {
    url: `${publicUrl}?v=${Date.now()}`,
    originalBytes: file.size,
    uploadedBytes: compressed.size,
  };
}

export function formatImageSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export const PRODUCT_IMAGE_MAX_DIMENSION = MAX_DIMENSION;