"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/src/lib/supabase";

type Order = {
  id: string;
  order_number: string;
  customer_name: string;
  email: string;
  product: string;
  outer_fabric: string;
  inner_fabric: string;
  strap_size: string | null;
  strap_color: string | null;
  mounting_type: string | null;
  status: string;
  price: number;
  created_at: string;
};


const STATUS_OPTIONS = [
  "pending",
  "confirmed",
  "in_production",
  "completed",
  "cancelled",
];

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  in_production: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-zinc-200 text-zinc-600",
};




export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();

  const orderNumber = params.orderNumber as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("order_number", orderNumber)
        .single();

      if (error) {
        console.error("Failed to fetch order:", error.message);
        setIsLoading(false);
        return;
      }

      setOrder(data as Order);
      setIsLoading(false);
    }

    fetchOrder();
  }, [orderNumber]);


  async function updateStatus(newStatus: string) {
  if (!order) return;

  const { error } = await supabase
    .from("orders")
    .update({ status: newStatus })
    .eq("id", order.id);

  if (error) {
    console.error("Failed to update status:", error.message);
    alert(`Could not update status: ${error.message}`);
    return;
  }

  setOrder({
    ...order,
    status: newStatus,
  });
}

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl p-8">
        <p className="text-sm text-zinc-500">Loading order...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-5xl p-8">
        <h1 className="text-xl font-semibold">Order not found</h1>

        <button
          onClick={() => router.push("/orders")}
          className="mt-4 text-sm underline"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-8">

      {/* HEADER */}

<div className="mb-8">

  <button
    onClick={() => router.push("/orders")}
    className="mb-6 text-sm text-zinc-400 transition hover:text-white"
  >
    ← Back to Orders
  </button>

  <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">

    <div>

      <p className="font-mono text-sm font-medium tracking-wide text-zinc-400">
        {order.order_number}
      </p>

      <h1 className="mt-2 text-4xl font-bold tracking-tight text-white">
        {order.product}
      </h1>

      <p className="mt-2 text-zinc-400">
        {order.customer_name}
      </p>

    </div>

    <button
      onClick={() =>
        router.push(`/orders/${order.order_number}/edit`)
      }
      className="rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 transition hover:bg-zinc-200"
    >
      Edit Order
    </button>

  </div>

</div>


{/* PRODUCTION STATUS */}

<section className="mb-8 rounded-xl border border-zinc-700 bg-zinc-900 p-6">

  <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

    <div>

      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        Current Status
      </p>

      <div className="mt-3">
        <span
          className={`rounded-full px-3 py-1.5 text-xs font-medium ${
            STATUS_STYLES[order.status] ??
            "bg-zinc-100 text-zinc-600"
          }`}
        >
          {order.status.replace("_", " ")}
        </span>
      </div>

    </div>


    <div className="flex flex-wrap gap-2">

      {order.status === "confirmed" && (
        <button
          type="button"
          onClick={() => updateStatus("in_production")}
          className="rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 transition hover:bg-zinc-200"
        >
          Start Production
        </button>
      )}

      {order.status === "in_production" && (
        <button
          type="button"
          onClick={() => updateStatus("completed")}
          className="rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 transition hover:bg-zinc-200"
        >
          Mark Completed
        </button>
      )}

    </div>

  </div>

</section>

      

      {/* MAIN CONTENT */}
      <div className="grid gap-6 md:grid-cols-2">

        {/* CUSTOMER */}
        <section className="rounded-xl border bg-white p-6">

          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Customer
          </h2>

          <div className="mt-4 space-y-3">

            <div>
              <p className="text-xs text-zinc-400">Name</p>
              <p className="font-medium">
                {order.customer_name}
              </p>
            </div>

            <div>
              <p className="text-xs text-zinc-400">Email</p>
              <p>
                {order.email}
              </p>
            </div>

          </div>

        </section>

        {/* ORDER CONFIGURATION */}
        <section className="rounded-xl border bg-white p-6">

          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Configuration
          </h2>

          <div className="mt-4 space-y-3">

            <div className="flex justify-between">
              <span className="text-zinc-500">
                Outer Fabric
              </span>

              <span className="font-medium">
                {order.outer_fabric}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-500">
                Inner Fabric
              </span>

              <span className="font-medium">
                {order.inner_fabric}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-500">
                Strap
              </span>

              <span className="font-medium">
                {order.strap_size ?? "—"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-500">
                Strap Color
              </span>

              <span className="font-medium">
                {order.strap_color ?? "—"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-500">
                Mounting
              </span>

              <span className="font-medium">
                {order.mounting_type ?? "—"}
              </span>
            </div>

          </div>

        </section>

        {/* PRICE */}
        <section className="rounded-xl border bg-white p-6">

          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Order Value
          </h2>

          <p className="mt-4 text-3xl font-bold">
            ₱{order.price.toFixed(2)}
          </p>

        </section>

        {/* ORDER INFORMATION */}
        <section className="rounded-xl border bg-white p-6">

          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Order Information
          </h2>

          <div className="mt-4 space-y-3">

            <div className="flex justify-between">
              <span className="text-zinc-500">
                Order Number
              </span>

              <span className="font-mono font-medium">
                {order.order_number}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-500">
                Created
              </span>

              <span>
                {new Date(order.created_at).toLocaleDateString()}
              </span>
            </div>

          </div>

        </section>

      </div>

    </div>
  );
}