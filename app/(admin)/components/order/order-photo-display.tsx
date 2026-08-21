"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/src/lib/supabase";

type OrderPhoto = {
  id: string;
  photo_url: string;
  caption: string | null;
  uploaded_at: string;
};

type OrderPhotoDisplayProps = {
  orderId: string;
};

export default function OrderPhotoDisplay({
  orderId,
}: OrderPhotoDisplayProps) {
  const [photo, setPhoto] = useState<OrderPhoto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLatestPhoto() {
      const { data, error } = await supabase
        .from("order_photos")
        .select("*")
        .eq("order_id", orderId)
        .order("uploaded_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Failed to fetch photo:", error.message);
        setIsLoading(false);
        return;
      }

      setPhoto(data as OrderPhoto);
      setIsLoading(false);
    }

    fetchLatestPhoto();
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="rounded-2xl border bg-white p-8">
        <p className="text-sm text-zinc-500">Loading photos...</p>
      </div>
    );
  }

  if (!photo) {
    return (
      <div className="rounded-2xl border bg-zinc-50 p-8 text-center">
        <p className="text-sm text-zinc-500">
          No photos yet. Add one to share progress with the customer.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-white p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-400">
        Latest Photo
      </p>

      <div className="mt-4">
        <img
          src={photo.photo_url}
          alt="Progress photo"
          className="w-full rounded-lg object-cover"
        />

        {photo.caption && (
          <p className="mt-4 text-sm text-zinc-700 italic">
            "{photo.caption}"
          </p>
        )}

        <p className="mt-3 text-xs text-zinc-400">
          {new Date(photo.uploaded_at).toLocaleString()}
        </p>
      </div>
    </div>
  );
}