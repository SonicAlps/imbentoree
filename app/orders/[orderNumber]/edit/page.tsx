// app/orders/[orderNumber]/edit/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import OrderForm from "@/components/order/order-form";
import OrderPageLayout from "@/components/order/order-page-layout";
import { supabase } from "@/src/lib/supabase";


type ExistingOrder = {
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
  target_completion_date: string | null;
  created_at: string;
  tracking_token: string;

};

export default function EditOrderPage() {
  const params = useParams();
  const orderNumber = params.orderNumber as string;

  const [order, setOrder] = useState<ExistingOrder | null>(null);
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

      setOrder(data as ExistingOrder);
      setIsLoading(false);
    }

    fetchOrder();
  }, [orderNumber]);

  if (isLoading) {
    return (
      <OrderPageLayout
        title="Loading..."
        subtitle="Fetching order details"
      >
        <p className="text-sm text-zinc-500">Loading order...</p>
      </OrderPageLayout>
    );
  }

  if (error || !order) {
    return (
      <OrderPageLayout
        title="Order not found"
        subtitle={error || "We couldn't find this order."}
      >
        <div />
      </OrderPageLayout>
    );
  }

  return (
    <OrderPageLayout
      title="Edit Order"
      subtitle="Review and update this order. The order number is permanently assigned to this bag."
      orderNumber={order.order_number}
    >
      <OrderForm mode="edit" initialOrder={order} />
    </OrderPageLayout>
  );
}