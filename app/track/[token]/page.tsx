// app/track/[token]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/src/lib/supabase";

type OrderTracking = {
  id: string;
  order_number: string;
  customer_name: string;
  product: string;
  status: string;
  created_at: string;
  target_completion_date: string | null;
  // ... other fields
};

export default function TrackOrderPage() {
  const params = useParams();
  const token = params.token as string;
  
  const [order, setOrder] = useState<OrderTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchOrder() {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("tracking_token", token)
        .single();

      if (error) {
        console.error("TRACKING ERROR:", error);
        setError(error.message);
        setLoading(false);
        return;
    }

      setOrder(data as OrderTracking);
      setLoading(false);
    }

    fetchOrder();
  }, [token]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (error || !order) return <div className="p-8">{error}</div>;

  return (
    <div className="min-h-screen bg-zinc-100 p-8">
      <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold">Track Your Order</h1>
        
        <div className="mt-6 space-y-4">
          <div>
            <p className="text-sm text-zinc-500">Order Number</p>
            <p className="font-mono text-lg font-bold">{order.order_number}</p>
          </div>
          
          <div>
            <p className="text-sm text-zinc-500">Name</p>
            <p className="text-lg">{order.customer_name}</p>
          </div>

          <div>
            <p className="text-sm text-zinc-500">Product</p>
            <p className="text-lg">{order.product}</p>
          </div>

          <div className="mt-6">
            <p className="text-sm text-zinc-500">Status</p>
            <div className="mt-2">
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${
                  order.status === "completed" ? "bg-green-500" : "bg-yellow-500"
                }`} />
                <span className="capitalize">{order.status}</span>
              </div>
            </div>
          </div>

          {order.target_completion_date && (
            <div>
              <p className="text-sm text-zinc-500">Expected Ready</p>
              <p className="text-lg">
                {new Date(order.target_completion_date).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}