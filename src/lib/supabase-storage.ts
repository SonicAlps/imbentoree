import { supabase } from "@/src/lib/supabase";

export async function uploadOrderPhoto(
  file: File,
  orderId: string
): Promise<string | null> {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${orderId}-${timestamp}-${file.name}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from("order-photos")
      .upload(filename, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Upload error:", error.message);
      return null;
    }

    // Get public URL
    const { data: publicData } = supabase.storage
      .from("order-photos")
      .getPublicUrl(data.path);

    return publicData.publicUrl;
  } catch (error) {
    console.error("Unexpected upload error:", error);
    return null;
  }
}