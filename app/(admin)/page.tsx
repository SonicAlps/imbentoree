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

  useEffect(() => {
    async function fetchStats() {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const [total, pending, thisMonth] = await Promise.all([
        supabase.from("orders").select("*", { count: "exact", head: true }),
        supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .gte("created_at", startOfMonth.toISOString()),
      ]);

      setTotalOrders(total.count ?? 0);
      setPendingOrders(pending.count ?? 0);
      setThisMonthOrders(thisMonth.count ?? 0);
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

        {/* STATS */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-zinc-500">Total Orders</p>
            <p className="mt-2 font-mono text-3xl font-bold text-zinc-900">
              {totalOrders ?? "–"}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-zinc-500">Pending</p>
            <p className="mt-2 font-mono text-3xl font-bold text-zinc-900">
              {pendingOrders ?? "–"}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-zinc-500">This Month</p>
            <p className="mt-2 font-mono text-3xl font-bold text-zinc-900">
              {thisMonthOrders ?? "–"}
            </p>
          </div>
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

        {/* CTA */}
        <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-zinc-900">
                Create an Order
              </h3>
              <p className="mt-1 text-sm text-zinc-500">
                Customize and generate order.
              </p>
            </div>

            <Link
              href="/new-order"
              className="rounded-lg bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              + New Order
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}