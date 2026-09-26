"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/src/lib/supabase";
import LiquidationForm from "@/app/(admin)/components/liquidation/liquidation-form";

export type LiquidationOrder = {
  id: string;
  order_number: string;
  customer_name: string;
  product: string;
  price: number;
  status: string;
};

export default function OrderLiquidationPage() {
  const params = useParams();
  const router = useRouter();

  const orderNumber = params.orderNumber as string;

  const [order, setOrder] =
    useState<LiquidationOrder | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      setIsLoading(true);

      const { data, error } = await supabase
        .from("orders")
        .select(
          "id, order_number, customer_name, product, price, status"
        )
        .eq("order_number", orderNumber)
        .single();

      if (error) {
        console.error(
          "Failed to fetch order:",
          error.message
        );

        setIsLoading(false);
        return;
      }

      setOrder(data as LiquidationOrder);
      setIsLoading(false);
    }

    if (orderNumber) {
      fetchOrder();
    }
  }, [orderNumber]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-10">
        <p className="text-sm text-zinc-400">
          Loading liquidation...
        </p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-white">
          Order not found
        </h1>

        <p className="mt-2 text-sm text-zinc-400">
          We could not find {orderNumber}.
        </p>

        <button
          type="button"
          onClick={() => router.push("/liquidation")}
          className="mt-6 text-sm text-zinc-400 transition hover:text-white"
        >
          ← Back to Liquidation
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      {/* BACK */}
      <button
        type="button"
        onClick={() => router.push("/liquidation")}
        className="mb-6 text-sm text-zinc-400 transition hover:text-white"
      >
        ← Back to Liquidation
      </button>

      {/* HEADER */}
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-sm font-medium tracking-wide text-zinc-400">
            {order.order_number}
          </p>

          <h1 className="mt-2 text-4xl font-bold tracking-tight text-white">
            Liquidation
          </h1>

          <p className="mt-2 text-zinc-400">
            {order.product} · {order.customer_name}
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            router.push(`/orders/${order.order_number}`)
          }
          className="rounded-lg border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
        >
          View Order
        </button>
      </div>

      {/* FORM */}
      <LiquidationForm order={order} />
    </div>
  );
}