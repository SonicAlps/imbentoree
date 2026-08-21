"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/src/lib/supabase";
import PhotoUpload from "@/app/(admin)/components/order/photo-upload";
import OrderPhotoDisplay from "@/app/(admin)/components/order/order-photo-display";

type OrderTracking = {
  id: string;
  order_number: string;
  customer_name: string;
  product: string;
  status: string;
  created_at: string;
  target_completion_date: string | null;
};

type OrderPhoto = {
  photo_url: string;
  caption: string | null;
  uploaded_at: string;
};

export default function TrackOrderPage() {
  const params = useParams();
  const token = params.token as string;

  const [order, setOrder] = useState<OrderTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [photo, setPhoto] = useState<OrderPhoto | null>(null);

  useEffect(() => {
    async function fetchOrder() {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("tracking_token", token)
        .maybeSingle();

      if (error) {
        console.error("TRACKING ERROR:", error);
        setError("We couldn't find this order.");
        setLoading(false);
        return;
      }

      if (!data) {
        setError("We couldn't find this order.");
        setLoading(false);
        return;
      }

      // Fetch latest photo
        const { data: photoData } = await supabase
         .from("order_photos")
         .select("photo_url, caption, uploaded_at")
         .eq("order_id", (data as any).id)
         .order("uploaded_at", { ascending: false })
         .limit(1)
         .maybeSingle();

      if (photoData) {
          setPhoto(photoData as OrderPhoto);
      }

      setOrder(data as OrderTracking);
      setLoading(false);
    }

    fetchOrder();
  }, [token]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900" />
          <p className="text-sm text-zinc-500">
            Loading your order...
          </p>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-sm">
          <img
            src="/logo.png"
            alt="Imbentoree Logo"
            className="mx-auto mb-6 h-16 w-16 rounded-md object-contain"
          />

          <h1 className="text-2xl font-bold text-zinc-900">
            Order Not Found
          </h1>

          <p className="mt-3 text-sm leading-6 text-zinc-500">
            {error}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-5 py-8 sm:px-6">
      <div className="mx-auto max-w-xl">

        {/* Brand */}
        <div className="mb-8 text-center">
          <img
            src="/logo.png"
            alt="Imbentoree Logo"
            className="mx-auto h-16 w-16 rounded-md object-contain"
          />

          <h1 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900">
            Track Your Order
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Here's the latest update on your Imbento Bags order.
          </p>
        </div>

        {/* Order card */}
<div className="overflow-hidden rounded-3xl bg-white shadow-sm">

  {/* Order header */}
  <div className="border-b border-zinc-100 p-6">
    <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
      Order Number
    </p>

    <p className="mt-1 font-mono text-xl font-bold text-zinc-900">
      {order.order_number}
    </p>
  </div>

  {/* Expected Ready - Small & Improved */}
  {order.target_completion_date && (
    <div className="border-b border-zinc-100 px-6 py-4 bg-zinc-50">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Expected Ready
        </p>
        <p className="text-lg font-semibold text-zinc-900">
          {new Date(
            order.target_completion_date
          ).toLocaleDateString("en-PH", {
            month: "short",
            day: "numeric",
          })}
        </p>
      </div>
    </div>
  )}

  {/* Order details */}
  <div className="space-y-6 p-6">

    <div>
      <p className="text-sm text-zinc-500">
        Customer
      </p>

      <p className="mt-1 text-lg font-medium text-zinc-900">
        {order.customer_name}
      </p>
    </div>

    <div>
      <p className="text-sm text-zinc-500">
        Product
      </p>

      <p className="mt-1 text-lg font-medium text-zinc-900">
        {order.product}
      </p>
    </div>

    {/* Status */}
    <div>
      <p className="text-sm text-zinc-500">
        Production Status
      </p>

      <div className="mt-3 flex items-center gap-3 rounded-2xl bg-zinc-50 p-4">
        <div
          className={`h-3 w-3 rounded-full ${
            order.status === "completed"
              ? "bg-green-500"
              : "bg-yellow-500"
          }`}
        />

        <span className="font-medium capitalize text-zinc-900">
          {order.status}
        </span>
      </div>
    </div>

    {/* Photo - As is */}
    {photo && (
      <div className="mt-6">
        <img
          src={photo.photo_url}
          alt="Progress photo"
          className="mx-auto max-w-sm rounded-2xl object-cover"
          style={{ maxHeight: "300px" }}
        />

        {photo.caption && (
          <p className="mt-4 text-center text-sm text-zinc-700 italic">
            "{photo.caption}"
          </p>
        )}

        <p className="mt-2 text-center text-xs text-zinc-400">
          {new Date(photo.uploaded_at).toLocaleString("en-PH")}
        </p>
      </div>
    )}

    {/* Help */}
    <div className="pt-4 border-t border-zinc-100">
      <p className="text-xs text-zinc-500">
        Questions? Reach out to us at{" "}
        <span className="font-medium text-zinc-700">imbentobags@gmail.com</span>
      </p>
    </div>
  </div>
</div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-zinc-400">
          Powered by Imbentoree
        </p>
      </div>
    </main>
  );
}