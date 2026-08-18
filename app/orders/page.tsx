"use client";

import { useEffect, useState } from "react";
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
  created_at: string;
};

const STATUS_OPTIONS = ["pending", "confirmed", "in_production", "completed", "cancelled"];

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  in_production: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-zinc-200 text-zinc-600",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  async function fetchOrders() {
    setIsLoading(true);

    let query = supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Failed to fetch orders:", error.message);
    } else {
      setOrders(data as Order[]);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  async function updateStatus(orderId: string, newStatus: string) {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      console.error("Failed to update status:", error.message);
      alert(`Could not update status: ${error.message}`);
      return;
    }

    // Update locally so the UI reflects the change immediately
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {orders.length} order{orders.length !== 1 ? "s" : ""}
            {statusFilter !== "all" ? ` · ${statusFilter}` : ""}
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-zinc-50"
        >
          Refresh
        </button>
      </div>

      {/* STATUS FILTER TABS */}
      <div className="mb-6 flex flex-wrap gap-2">
        {["all", ...STATUS_OPTIONS].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              statusFilter === status
                ? "bg-black text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            {status === "all" ? "All" : status.replace("_", " ")}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-zinc-500">Loading orders...</p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-zinc-500">No orders found.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="w-full text-sm">
            <thead className="border-b bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3">Order #</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Specs</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-mono text-xs">{order.order_number}</td>
                  <td className="px-4 py-3 font-medium">{order.customer_name}</td>
                  <td className="px-4 py-3 text-zinc-500">{order.email}</td>
                  <td className="px-4 py-3">{order.product}</td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {order.outer_fabric} / {order.inner_fabric}
                    {order.strap_size ? ` · ${order.strap_size}` : ""}
                    {order.strap_color ? ` · ${order.strap_color}` : ""}
                    {order.mounting_type ? ` · ${order.mounting_type}` : ""}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                      className={`rounded-full border-0 px-2 py-1 text-xs font-medium ${
                        STATUS_STYLES[order.status] ?? "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
