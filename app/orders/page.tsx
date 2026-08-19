"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/src/lib/supabase";
import Link from "next/link";

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

const STATUS_FLOW: Record<string, string[]> = {
  pending: ["pending", "confirmed", "cancelled"],
  confirmed: ["confirmed", "in_production", "cancelled"],
  in_production: ["in_production", "completed"],
  completed: ["completed"],
  cancelled: ["cancelled"],
};


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
  
  const [searchQuery, setSearchQuery] = useState("");

  const pendingCount = orders.filter(
  (order) => order.status === "pending"
  ).length;

  const confirmedCount = orders.filter(
  (order) => order.status === "confirmed"
  ).length;

  const inProductionCount = orders.filter(
  (order) => order.status === "in_production"
  ).length;

const completedCount = orders.filter(
  (order) => order.status === "completed"
).length;
  

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

  const filteredOrders = orders.filter((order) => {
  const query = searchQuery.trim().toLowerCase();

  if (!query) return true;

  return (
    order.order_number.toLowerCase().includes(query) ||
    order.customer_name.toLowerCase().includes(query) ||
    order.email.toLowerCase().includes(query) ||
    order.product.toLowerCase().includes(query)
  );
});

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
      <div className="mb-8 flex items-end justify-between">
        

  <div>
    <h1 className="text-5xl font-bold tracking-tight text-white">
      Orders
    </h1>

    <p className="mt-1 text-sm text-white">
      Manage and track every Imbento bag.
    </p>
  </div>


</div>

<div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">

  <button
    type="button"
    onClick={() => setStatusFilter("pending")}
    className={`rounded-xl border p-5 text-left transition ${
      statusFilter === "pending"
        ? "border-zinc-900 bg-zinc-900 text-white"
        : "bg-white hover:border-zinc-400"
    }`}
  >
    <p className="text-xs font-medium uppercase tracking-wide opacity-60">
      Pending
    </p>

    <p className="mt-2 text-3xl font-bold">
      {pendingCount}
    </p>
  </button>

  <button
    type="button"
    onClick={() => setStatusFilter("confirmed")}
    className={`rounded-xl border p-5 text-left transition ${
      statusFilter === "confirmed"
        ? "border-zinc-900 bg-zinc-900 text-white"
        : "bg-white hover:border-zinc-400"
    }`}
  >
    <p className="text-xs font-medium uppercase tracking-wide opacity-60">
      Confirmed
    </p>

    <p className="mt-2 text-3xl font-bold">
      {confirmedCount}
    </p>
  </button>

  <button
    type="button"
    onClick={() => setStatusFilter("in_production")}
    className={`rounded-xl border p-5 text-left transition ${
      statusFilter === "in_production"
        ? "border-zinc-900 bg-zinc-900 text-white"
        : "bg-white hover:border-zinc-400"
    }`}
  >
    <p className="text-xs font-medium uppercase tracking-wide opacity-60">
      In Production
    </p>

    <p className="mt-2 text-3xl font-bold">
      {inProductionCount}
    </p>
  </button>

  <button
    type="button"
    onClick={() => setStatusFilter("completed")}
    className={`rounded-xl border p-5 text-left transition ${
      statusFilter === "completed"
        ? "border-zinc-900 bg-zinc-900 text-white"
        : "bg-white hover:border-zinc-400"
    }`}
  >
    <p className="text-xs font-medium uppercase tracking-wide opacity-60">
      Completed
    </p>

    <p className="mt-2 text-3xl font-bold">
      {completedCount}
    </p>
  </button>

</div>

      {/* STATUS FILTER TABS */}
      <div className="mb-6 rounded-xl border bg-white p-4">

  <input
    type="search"
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    placeholder="Search order number, customer, email, or product..."
    className="w-full rounded-lg border bg-zinc-50 px-4 py-3 text-sm outline-none focus:border-zinc-400 focus:bg-white"
  />

  <div className="mt-4 flex flex-wrap gap-2">

    {["all", ...STATUS_OPTIONS].map((status) => (
      <button
        key={status}
        onClick={() => setStatusFilter(status)}
        className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
          statusFilter === status
            ? "bg-zinc-900 text-white"
            : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
        }`}
      >
        {status === "all"
          ? "All"
          : status.replace("_", " ")}
      </button>
    ))}

  </div>

</div>

<div className="mb-3 flex items-center justify-between">
  <p className="text-sm text-zinc-500">
    {filteredOrders.length}{" "}
    {filteredOrders.length === 1 ? "order" : "orders"}
    {searchQuery.trim() && " found"}
  </p>

  {(searchQuery || statusFilter !== "all") && (
    <button
      type="button"
      onClick={() => {
        setSearchQuery("");
        setStatusFilter("all");
      }}
      className="text-xs font-medium text-zinc-500 hover:text-zinc-900"
    >
      Clear filters
    </button>
  )}
</div>



      {isLoading ? (
        <p className="text-sm text-zinc-500">Loading orders...</p>
      ) : filteredOrders.length === 0 ? (
  <div className="rounded-xl border bg-white px-6 py-12 text-center">
    <p className="font-medium text-zinc-900">
      {orders.length === 0
        ? "No orders yet."
        : "No matching orders."}
    </p>

    <p className="mt-1 text-sm text-zinc-500">
      {orders.length === 0
        ? "Create your first Imbento order to get started."
        : "Try a different search or clear your filters."}
    </p>

    {orders.length > 0 && (
      <button
        type="button"
        onClick={() => {
          setSearchQuery("");
          setStatusFilter("all");
        }}
        className="mt-4 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-zinc-50"
      >
        Clear filters
      </button>
    )}
  </div>
) : (
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="w-full text-sm">
            <thead className="border-b bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3">Order #</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Specs</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-mono text-xs">
                    <Link
                    href={`/orders/${order.order_number}`}
                    className="hover:underline">
                      {order.order_number}
                    </Link></td>
                  <td className="px-4 py-3 font-medium">{order.customer_name}</td>
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
