"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import OrderForm from "@/components/order/order-form";
import { supabase } from "@/src/lib/supabase";

type Order = {
  id: string;
  order_number: string;
  customer_name: string;
  email: string;
  product: "Pouch" | "Small Sling" | "Big Sling";
  outer_fabric: string;
  inner_fabric: string;
  strap_size: string | null;
  strap_color: string | null;
  mounting_type: string | null;
  status: string;
  price: number;
  created_at: string;
};

export default function EditOrderPage() {
  const params = useParams();
  const orderNumber = params.orderNumber as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchOrder() {
      setIsLoading(true);

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("order_number", orderNumber)
        .single();

      if (error) {
        console.error("Failed to fetch order:", error.message);
        setError(error.message);
        setIsLoading(false);
        return;
      }

      setOrder(data as Order);
      setIsLoading(false);
    }

    fetchOrder();
  }, [orderNumber]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl p-8">
        <p className="text-sm text-zinc-500">Loading order...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-6xl p-8">
        <h1 className="text-xl font-semibold">Order not found</h1>
        <p className="mt-2 text-sm text-zinc-500">
          {error || "We couldn't find this order."}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-8">
      <div className="mb-6">
        <p className="font-mono text-sm text-zinc-500">
          {order.order_number}
        </p>

        <h1 className="mt-1 text-2xl font-bold">
          Edit Order
        </h1>

        <p className="mt-1 text-sm text-zinc-500">
            Review and update this order. The order number is permanently assigned
            to this bag.
</p>
      </div>

      <OrderForm
        mode="edit"
        initialOrder={order}
      />
    </div>
  );
}