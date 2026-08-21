"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/src/lib/supabase";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type ProductCount = {
  product: string;
  count: number;
};

export default function Home() {
  const [totalOrders, setTotalOrders] = useState<number | null>(null);
  const [pendingOrders, setPendingOrders] = useState<number | null>(null);
  const [thisMonthOrders, setThisMonthOrders] = useState<number | null>(null);
  const [productCounts, setProductCounts] = useState<ProductCount[]>([]);
  const [isLoadingChart, setIsLoadingChart] = useState(true);
  const [confirmedOrders, setConfirmedOrders] = useState<number | null>(null);
  const [inProductionOrders, setInProductionOrders] = useState<number | null>(null);
  const [completedOrders, setCompletedOrders] = useState<number | null>(null);
  const [pendingOrdersList, setPendingOrdersList] = useState<Order[]>([]);
  const [inProductionOrdersList, setInProductionOrdersList] = useState<Order[]>([]);

  type Order = {
  id: string;
  order_number: string;
  customer_name: string;
  product: string;
  outer_fabric: string;
  inner_fabric: string;
  status: string;
  created_at: string;
  target_completion_date: string | null;
};

  useEffect(() => {
    async function fetchStats() {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const [total, pending, thisMonth, confirmed, inProduction, completed] = await Promise.all([
  supabase.from("orders").select("*", { count: "exact", head: true }),
  supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending"),
  supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startOfMonth.toISOString()),
  supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("status", "confirmed"),
  supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("status", "in_production"),
  supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("status", "completed"),
]);

setTotalOrders(total.count ?? 0);
setPendingOrders(pending.count ?? 0);
setThisMonthOrders(thisMonth.count ?? 0);
setConfirmedOrders(confirmed.count ?? 0);
setInProductionOrders(inProduction.count ?? 0);
setCompletedOrders(completed.count ?? 0);


    }

    async function fetchProductCounts() {
      setIsLoadingChart(true);

      const { data, error } = await supabase.from("orders").select("product");

      if (error) {
        console.error("Failed to fetch product counts:", error.message);
        setIsLoadingChart(false);
        return;
      }

      const counts: Record<string, number> = {};
      for (const row of data as { product: string }[]) {
        counts[row.product] = (counts[row.product] ?? 0) + 1;
      }

      const formatted = Object.entries(counts).map(([product, count]) => ({
        product,
        count,
      }));

      setProductCounts(formatted);
      setIsLoadingChart(false);
    }

    fetchStats();
    fetchProductCounts();
  }, []);
  
    async function fetchActionNeeded() {
    const { data: pending } = await supabase
      .from("orders")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    const { data: inProduction } = await supabase
      .from("orders")
      .select("*")
      .eq("status", "in_production")
      .order("created_at", { ascending: true });

    setPendingOrdersList((pending as Order[]) || []);
    setInProductionOrdersList((inProduction as Order[]) || []);
}

fetchActionNeeded();

  return (
    <main className="min-h-screen bg-[#FAFAF9]">
      <section className="mx-auto max-w-7xl px-6 py-10">
        
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
            Dashboard
          </h2>
          <p className="mt-2 text-zinc-600">
            An overview of your purchase orders and products sold.
          </p>
          
        </div>
        

        <div className="grid gap-6 md:grid-cols-5">
  <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
    <p className="text-sm text-zinc-500">Pending</p>
    <p className="mt-2 font-mono text-3xl font-bold text-yellow-600">
      {pendingOrders ?? "–"}
    </p>
    <p className="mt-2 text-xs text-zinc-400">awaiting confirmation</p>
  </div>

  <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
    <p className="text-sm text-zinc-500">Confirmed</p>
    <p className="mt-2 font-mono text-3xl font-bold text-blue-600">
      {confirmedOrders ?? "–"}
    </p>
    <p className="mt-2 text-xs text-zinc-400">ready to produce</p>
  </div>

  <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
    <p className="text-sm text-zinc-500">In Production</p>
    <p className="mt-2 font-mono text-3xl font-bold text-purple-600">
      {inProductionOrders ?? "–"}
    </p>
    <p className="mt-2 text-xs text-zinc-400">hands-on work</p>
  </div>

  <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
    <p className="text-sm text-zinc-500">Completed</p>
    <p className="mt-2 font-mono text-3xl font-bold text-green-600">
      {completedOrders ?? "–"}
    </p>
    <p className="mt-2 text-xs text-zinc-400">shipped</p>
  </div>

  <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
    <p className="text-sm text-zinc-500">Total Orders</p>
    <p className="mt-2 font-mono text-3xl font-bold text-zinc-900">
      {totalOrders ?? "–"}
    </p>
    <p className="mt-2 text-xs text-zinc-400">all time</p>
  </div>
</div>


{/* ACTION NEEDED WIDGET */}
<div className="mt-8 rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
  <div className="mb-6">
    <h3 className="text-lg font-semibold text-zinc-900">
      Action Needed
    </h3>
    <p className="mt-1 text-sm text-zinc-500">
      Orders awaiting your attention.
    </p>
  </div>

  {pendingOrdersList.length === 0 && inProductionOrdersList.length === 0 ? (
    <p className="text-sm text-zinc-500">All caught up! No pending or active orders.</p>
  ) : (
    <div className="space-y-8">
      {/* PENDING SECTION */}
      {pendingOrdersList.length > 0 && (
  <div>
    <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-yellow-600">
      Pending (Awaiting Confirmation)
    </h4>
    <div className="space-y-2">
      {pendingOrdersList.map((order) => {
        const daysOld = Math.floor(
          (Date.now() - new Date(order.created_at).getTime()) / (1000 * 60 * 60 * 24)
        );
        const daysLeft = order.target_completion_date
          ? Math.ceil(
              (new Date(order.target_completion_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            )
          : null;
        
        return (
          <Link
            key={order.id}
            href={`/orders/${order.order_number}`}
            className="grid grid-cols-12 items-center gap-4 rounded-lg border border-zinc-100 p-3 hover:bg-zinc-50 transition"
          >
            <p className="col-span-2 font-mono text-sm font-medium text-zinc-900">
              {order.order_number}
            </p>
            <p className="col-span-2 text-sm text-zinc-600">
              {order.customer_name}
            </p>
            <p className="col-span-3 text-xs text-zinc-500">
              {order.outer_fabric} / {order.inner_fabric}
            </p>
            <p className="col-span-2 text-xs text-zinc-400 text-right">
              {daysOld === 0 ? "Today" : `${daysOld}d ago`}
            </p>
            {daysLeft !== null && (
              <p className={`col-span-3 text-xs font-medium text-right ${
                daysLeft < 0 ? "text-red-600" : daysLeft <= 2 ? "text-orange-600" : "text-green-600"
              }`}>
                {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
              </p>
            )}
          </Link>
        );
      })}
    </div>
  </div>
)}

      {/* IN PRODUCTION SECTION */}
      {inProductionOrdersList.length > 0 && (
  <div>
    <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-purple-600">
      In Production (Active Work)
    </h4>
    <div className="space-y-2">
      {inProductionOrdersList.map((order) => {
        const daysActive = Math.floor(
          (Date.now() - new Date(order.created_at).getTime()) / (1000 * 60 * 60 * 24)
        );
        const daysLeft = order.target_completion_date
          ? Math.ceil(
              (new Date(order.target_completion_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            )
          : null;

        return (
          <Link
            key={order.id}
            href={`/orders/${order.order_number}`}
            className="grid grid-cols-12 items-center gap-4 rounded-lg border border-zinc-100 p-3 hover:bg-zinc-50 transition"
          >
            <p className="col-span-2 font-mono text-sm font-medium text-zinc-900">
              {order.order_number}
            </p>
            <p className="col-span-2 text-sm text-zinc-600">
              {order.customer_name}
            </p>
            <p className="col-span-3 text-xs text-zinc-500">
              {order.outer_fabric} / {order.inner_fabric}
            </p>
            <p className="col-span-2 text-xs text-zinc-400 text-right">
              {daysActive === 0 ? "Today" : `${daysActive}d ago`}
            </p>
            {daysLeft !== null && (
              <p className={`col-span-3 text-xs font-medium text-right ${
                daysLeft < 0 ? "text-red-600" : daysLeft <= 2 ? "text-orange-600" : "text-green-600"
              }`}>
                {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
              </p>
            )}
          </Link>
        );
      })}
    </div>
  </div>
)}
    </div>
  )}
</div>

        {/* PRODUCTS SOLD CHART */}
        <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-zinc-900">
              Products Sold
            </h3>
            <p className="mt-1 text-sm text-zinc-500">
              Order count by product, across all time.
            </p>
          </div>

          {isLoadingChart ? (
            <p className="text-sm text-zinc-500">Loading chart...</p>
          ) : productCounts.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No orders yet — this fills in once orders start coming in.
            </p>
          ) : (
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={productCounts}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#e4e4e7" />
                  <XAxis
                    dataKey="product"
                    tick={{ fill: "#71717a", fontSize: 12 }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "#71717a", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #e4e4e7",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="count" fill="#18181b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        
        
      </section>
    </main>
  );
}