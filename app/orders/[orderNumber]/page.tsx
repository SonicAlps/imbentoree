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

type StatusHistory = {
  id: string;
  order_id: string;
  status: string;
  created_at: string;
};

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
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);
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

      // Fetch status history
      const { data: historyData, error: historyError } = await supabase
        .from("order_status_history")
        .select("*")
        .eq("order_id", data.id)
        .order("created_at", { ascending: false });

      if (historyError) {
        console.error(
          "Failed to fetch order history:",
          historyError.message
        );
      } else {
        console.log("ORDER HISTORY:", historyData);
        setStatusHistory(historyData as StatusHistory[]);
      }

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
      <div className="mx-auto max-w-7xl p-8">
        <p className="text-sm text-zinc-500">
          Loading order...
        </p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-5xl p-8">
        <h1 className="text-xl font-semibold">
          Order not found
        </h1>

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
    <div className="mx-auto max-w-6xl px-6 py-10">

      {/* HEADER */}
      <div className="mb-10">

        <button
          onClick={() => router.push("/orders")}
          className="mb-6 text-sm text-zinc-400 transition hover:text-white"
        >
          ← Back to Orders
        </button>

        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">

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


      {/* PAGE CONTENT */}
      <div className="space-y-8">


        {/* CURRENT STATUS */}
        <section className="rounded-2xl border border-zinc-700 bg-zinc-900 p-6">

          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <p className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-500">
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


            {/* STATUS ACTIONS */}
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


        {/* INFORMATION + PRODUCTION */}
        <div className="w-full">

          <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,1.8fr)_minmax(360px,0.9fr)]">


            {/* LEFT — ORDER INFORMATION */}
            <section className="min-w-0 rounded-2xl border bg-white p-8">


              {/* CUSTOMER */}
              <div>

                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-400">
                  Customer
                </p>

                <div className="mt-4">

                  <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
                    {order.customer_name}
                  </h2>

                  <p className="mt-1 text-sm text-zinc-500">
                    {order.email}
                  </p>

                </div>

              </div>


              {/* DIVIDER */}
              <div className="my-8 border-t" />


              {/* BAG CONFIGURATION */}
              <div>

                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-400">
                  Bag Configuration
                </p>

                <div className="mt-5 divide-y">

                  <div className="flex items-center justify-between py-3">
                    <span className="text-sm text-zinc-500">
                      Outer Fabric
                    </span>

                    <span className="text-sm font-medium text-zinc-900">
                      {order.outer_fabric}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <span className="text-sm text-zinc-500">
                      Inner Fabric
                    </span>

                    <span className="text-sm font-medium text-zinc-900">
                      {order.inner_fabric}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <span className="text-sm text-zinc-500">
                      Strap
                    </span>

                    <span className="text-sm font-medium text-zinc-900">
                      {order.strap_size ?? "—"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <span className="text-sm text-zinc-500">
                      Strap Color
                    </span>

                    <span className="text-sm font-medium text-zinc-900">
                      {order.strap_color ?? "—"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <span className="text-sm text-zinc-500">
                      Mounting
                    </span>

                    <span className="text-sm font-medium text-zinc-900">
                      {order.mounting_type ?? "—"}
                    </span>
                  </div>

                </div>

              </div>


              {/* DIVIDER */}
              <div className="my-8 border-t" />


              {/* ORDER DETAILS */}
              <div>

                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-400">
                  Order Details
                </p>

                <div className="mt-5 space-y-4">

                  <div className="flex items-center justify-between">

                    <span className="text-sm text-zinc-500">
                      Order Value
                    </span>

                    <span className="text-xl font-semibold tracking-tight text-zinc-900">
                      ₱{order.price.toFixed(2)}
                    </span>

                  </div>

                  <div className="flex items-center justify-between">

                    <span className="text-sm text-zinc-500">
                      Order Number
                    </span>

                    <span className="font-mono text-sm font-medium text-zinc-900">
                      {order.order_number}
                    </span>

                  </div>

                  <div className="flex items-center justify-between">

                    <span className="text-sm text-zinc-500">
                      Created
                    </span>

                    <span className="text-sm text-zinc-900">
                      {new Date(order.created_at).toLocaleDateString()}
                    </span>

                  </div>

                </div>

              </div>

            </section>


            {/* RIGHT — PRODUCTION TIMELINE */}
            <section className="min-w-0 rounded-2xl border bg-white p-8">

              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-400">
                Production
              </p>

              <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-900">
                Order Timeline
              </h2>


              <div className="mt-8 space-y-6">

                {statusHistory.length === 0 ? (

                  <p className="text-sm text-zinc-400">
                    No status history yet.
                  </p>

                ) : (

                  statusHistory.map((history, index) => (

                    <div
                      key={history.id}
                      className="flex gap-4"
                    >

                      {/* TIMELINE DOT */}
                      <div className="flex flex-col items-center">

                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                            index === 0
                              ? "bg-zinc-900 text-white"
                              : "bg-zinc-100 text-zinc-500"
                          }`}
                        >
                          {index === 0 ? "✓" : "•"}
                        </div>

                        {index !== statusHistory.length - 1 && (
                          <div className="mt-2 h-full w-px bg-zinc-200" />
                        )}

                      </div>


                      {/* EVENT */}
                      <div className="pb-2">

                        <p className="font-medium capitalize text-zinc-900">
                          {history.status.replace("_", " ")}
                        </p>

                        <p className="mt-1 text-xs text-zinc-400">
                          {new Date(history.created_at).toLocaleString()}
                        </p>

                      </div>

                    </div>

                  ))

                )}

              </div>

            </section>


          </div>

        </div>


      </div>

    </div>
  );
}