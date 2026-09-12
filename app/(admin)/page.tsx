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

  price: number;
  material_cost: number;
  labor_cost: number;
  total_production_cost: number;
  profit: number;
  profit_margin: number;
};

type FinancialMetrics = {
  revenue: number;
  materialCost: number;
  laborCost: number;
  productionCost: number;
  profit: number;
  margin: number;
};

const EMPTY_METRICS: FinancialMetrics = {
  revenue: 0,
  materialCost: 0,
  laborCost: 0,
  productionCost: 0,
  profit: 0,
  margin: 0,
};

function calculateMetrics(orders: Order[]): FinancialMetrics {
  const revenue = orders.reduce(
    (sum, order) => sum + Number(order.price || 0),
    0
  );

  const materialCost = orders.reduce(
    (sum, order) => sum + Number(order.material_cost || 0),
    0
  );

  const laborCost = orders.reduce(
    (sum, order) => sum + Number(order.labor_cost || 0),
    0
  );

  const productionCost = orders.reduce(
    (sum, order) => sum + Number(order.total_production_cost || 0),
    0
  );

  const profit = orders.reduce(
    (sum, order) => sum + Number(order.profit || 0),
    0
  );

  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

  return {
    revenue,
    materialCost,
    laborCost,
    productionCost,
    profit,
    margin,
  };
}

function formatPeso(value: number) {
  return `₱${value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getPHTDateString() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function getPHTMonthStart() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;

  return `${year}-${month}-01`;
}

export default function Home() {
  const [totalOrders, setTotalOrders] = useState<number | null>(null);
  const [pendingOrders, setPendingOrders] = useState<number | null>(null);
  const [thisMonthOrders, setThisMonthOrders] = useState<number | null>(null);
  const [confirmedOrders, setConfirmedOrders] = useState<number | null>(null);
  const [inProductionOrders, setInProductionOrders] = useState<number | null>(
    null
  );
  const [completedOrders, setCompletedOrders] = useState<number | null>(null);

  const [productCounts, setProductCounts] = useState<ProductCount[]>([]);
  const [isLoadingChart, setIsLoadingChart] = useState(true);

  const [allTimeMetrics, setAllTimeMetrics] =
    useState<FinancialMetrics>(EMPTY_METRICS);

  const [todayMetrics, setTodayMetrics] =
    useState<FinancialMetrics>(EMPTY_METRICS);

  const [monthMetrics, setMonthMetrics] =
    useState<FinancialMetrics>(EMPTY_METRICS);

  const [pendingOrdersList, setPendingOrdersList] = useState<Order[]>([]);
  const [inProductionOrdersList, setInProductionOrdersList] = useState<Order[]>(
    []
  );

  useEffect(() => {
    async function fetchDashboard() {
      const today = getPHTDateString();
      const monthStart = getPHTMonthStart();

      /*
       * ============================================================
       * ORDERS
       * ============================================================
       */

      const { data: allOrders, error: ordersError } = await supabase
        .from("orders")
        .select(
          `
          id,
          order_number,
          customer_name,
          product,
          outer_fabric,
          inner_fabric,
          status,
          created_at,
          target_completion_date,
          price,
          material_cost,
          labor_cost,
          total_production_cost,
          profit,
          profit_margin
        `
        );

      if (ordersError) {
        console.error(
          "Failed to fetch dashboard orders:",
          ordersError.message
        );
        return;
      }

      const orders = (allOrders || []) as Order[];

      /*
       * Cancelled orders should not count toward financial performance.
       */
      const financialOrders = orders.filter(
        (order) => order.status !== "cancelled"
      );

      /*
       * ============================================================
       * ORDER STATUS COUNTS
       * ============================================================
       */

      setTotalOrders(orders.length);

      setPendingOrders(
        orders.filter((order) => order.status === "pending").length
      );

      setConfirmedOrders(
        orders.filter((order) => order.status === "confirmed").length
      );

      setInProductionOrders(
        orders.filter((order) => order.status === "in_production").length
      );

      setCompletedOrders(
        orders.filter((order) => order.status === "completed").length
      );

      /*
       * ============================================================
       * TIME PERIODS
       * ============================================================
       */

      const todayOrders = financialOrders.filter(
        (order) => order.created_at.slice(0, 10) === today
      );

      const monthOrders = financialOrders.filter(
        (order) => order.created_at >= monthStart
      );

      setThisMonthOrders(monthOrders.length);

      /*
       * ============================================================
       * FINANCIAL METRICS
       *
       * These use the production-cost snapshot stored on the order.
       *
       * Revenue
       * - price
       *
       * Material Cost
       * - material_cost
       *
       * Labor Cost
       * - labor_cost
       *
       * Production Cost
       * - total_production_cost
       *
       * Gross Profit
       * - profit
       *
       * Margin
       * - total profit / total revenue
       * ============================================================
       */

      setAllTimeMetrics(calculateMetrics(financialOrders));
      setTodayMetrics(calculateMetrics(todayOrders));
      setMonthMetrics(calculateMetrics(monthOrders));

      /*
       * ============================================================
       * PRODUCT COUNTS
       * ============================================================
       */

      setIsLoadingChart(true);

      const counts: Record<string, number> = {};

      for (const order of financialOrders) {
        counts[order.product] = (counts[order.product] ?? 0) + 1;
      }

      const formatted = Object.entries(counts).map(
        ([product, count]) => ({
          product,
          count,
        })
      );

      setProductCounts(formatted);
      setIsLoadingChart(false);

      /*
       * ============================================================
       * ACTION NEEDED
       * ============================================================
       */

      const pending = orders
        .filter((order) => order.status === "pending")
        .sort(
          (a, b) =>
            new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime()
        );

      const inProduction = orders
        .filter((order) => order.status === "in_production")
        .sort(
          (a, b) =>
            new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime()
        );

      setPendingOrdersList(pending);
      setInProductionOrdersList(inProduction);
    }

    fetchDashboard();
  }, []);

  function getDaysOld(createdAt: string) {
    const now = new Date();
    const created = new Date(createdAt);

    return Math.floor(
      (now.getTime() - created.getTime()) /
        (1000 * 60 * 60 * 24)
    );
  }

  function getDaysLeft(targetDate: string | null) {
    if (!targetDate) return null;

    const today = new Date();
    const target = new Date(`${targetDate}T23:59:59`);

    return Math.ceil(
      (target.getTime() - today.getTime()) /
        (1000 * 60 * 60 * 24)
    );
  }

  return (
    <main className="min-h-screen bg-[#FAFAF9]">
      <section className="mx-auto max-w-7xl px-6 py-10">

        {/* ======================================================
            HEADER
            ====================================================== */}

        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
            Dashboard
          </h2>

          <p className="mt-2 text-zinc-600">
            An overview of your orders, production, and business performance.
          </p>
        </div>

        {/* ======================================================
            ORDER STATUS
            ====================================================== */}

        <div className="grid gap-6 md:grid-cols-5">

          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-zinc-500">Pending</p>

            <p className="mt-2 font-mono text-3xl font-bold text-yellow-600">
              {pendingOrders ?? "–"}
            </p>

            <p className="mt-2 text-xs text-zinc-400">
              awaiting confirmation
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-zinc-500">Confirmed</p>

            <p className="mt-2 font-mono text-3xl font-bold text-blue-600">
              {confirmedOrders ?? "–"}
            </p>

            <p className="mt-2 text-xs text-zinc-400">
              ready to produce
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-zinc-500">In Production</p>

            <p className="mt-2 font-mono text-3xl font-bold text-purple-600">
              {inProductionOrders ?? "–"}
            </p>

            <p className="mt-2 text-xs text-zinc-400">
              hands-on work
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-zinc-500">Completed</p>

            <p className="mt-2 font-mono text-3xl font-bold text-green-600">
              {completedOrders ?? "–"}
            </p>

            <p className="mt-2 text-xs text-zinc-400">
              completed orders
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-zinc-500">Total Orders</p>

            <p className="mt-2 font-mono text-3xl font-bold text-zinc-900">
              {totalOrders ?? "–"}
            </p>

            <p className="mt-2 text-xs text-zinc-400">
              all time
            </p>
          </div>

        </div>

        {/* ======================================================
            ALL TIME FINANCIALS
            ====================================================== */}

        <div className="mt-8">

          <div className="mb-4">
            <h3 className="text-lg font-semibold text-zinc-900">
              Business Performance
            </h3>

            <p className="mt-1 text-sm text-zinc-500">
              Based on saved production costs from each order.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">

            {/* REVENUE */}

            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-zinc-500">
                Total Revenue
              </p>

              <p className="mt-2 font-mono text-3xl font-bold text-zinc-900">
                {formatPeso(allTimeMetrics.revenue)}
              </p>

              <p className="mt-2 text-xs text-zinc-400">
                all time
              </p>
            </div>

            {/* PRODUCTION COST */}

            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-zinc-500">
                Production Cost
              </p>

              <p className="mt-2 font-mono text-3xl font-bold text-orange-600">
                {formatPeso(allTimeMetrics.productionCost)}
              </p>

              <p className="mt-2 text-xs text-zinc-400">
                materials + labor
              </p>
            </div>

            {/* PROFIT */}

            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-zinc-500">
                Gross Profit
              </p>

              <p className="mt-2 font-mono text-3xl font-bold text-green-600">
                {formatPeso(allTimeMetrics.profit)}
              </p>

              <p className="mt-2 text-xs text-zinc-400">
                {allTimeMetrics.margin.toFixed(1)}% margin
              </p>
            </div>

          </div>

          {/* COST BREAKDOWN */}

          <div className="mt-6 grid gap-6 md:grid-cols-3">

            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-zinc-500">
                Material Cost
              </p>

              <p className="mt-2 font-mono text-2xl font-bold text-zinc-900">
                {formatPeso(allTimeMetrics.materialCost)}
              </p>

              <p className="mt-2 text-xs text-zinc-400">
                raw materials
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-zinc-500">
                Labor Cost
              </p>

              <p className="mt-2 font-mono text-2xl font-bold text-zinc-900">
                {formatPeso(allTimeMetrics.laborCost)}
              </p>

              <p className="mt-2 text-xs text-zinc-400">
                production labor
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-zinc-500">
                Profit Margin
              </p>

              <p className="mt-2 font-mono text-2xl font-bold text-blue-600">
                {allTimeMetrics.margin.toFixed(1)}%
              </p>

              <p className="mt-2 text-xs text-zinc-400">
                gross profit / revenue
              </p>
            </div>

          </div>

        </div>

        {/* ======================================================
            THIS MONTH
            ====================================================== */}

        <div className="mt-8">

          <div className="mb-4">
            <h3 className="text-lg font-semibold text-zinc-900">
              This Month
            </h3>

            <p className="mt-1 text-sm text-zinc-500">
              Current month's order and financial performance.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-4">

            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-zinc-500">
                Orders
              </p>

              <p className="mt-2 font-mono text-3xl font-bold text-zinc-900">
                {thisMonthOrders ?? "–"}
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-zinc-500">
                Revenue
              </p>

              <p className="mt-2 font-mono text-2xl font-bold text-zinc-900">
                {formatPeso(monthMetrics.revenue)}
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-zinc-500">
                Production Cost
              </p>

              <p className="mt-2 font-mono text-2xl font-bold text-orange-600">
                {formatPeso(monthMetrics.productionCost)}
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-zinc-500">
                Profit
              </p>

              <p className="mt-2 font-mono text-2xl font-bold text-green-600">
                {formatPeso(monthMetrics.profit)}
              </p>

              <p className="mt-2 text-xs text-zinc-400">
                {monthMetrics.margin.toFixed(1)}% margin
              </p>
            </div>

          </div>

        </div>

        {/* ======================================================
            TODAY
            ====================================================== */}

        <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-zinc-900">
              Today
            </h3>

            <p className="mt-1 text-sm text-zinc-500">
              Orders created today, based on Philippine time.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-4">

            <div>
              <p className="text-sm text-zinc-500">
                Revenue
              </p>

              <p className="mt-1 font-mono text-2xl font-bold text-zinc-900">
                {formatPeso(todayMetrics.revenue)}
              </p>
            </div>

            <div>
              <p className="text-sm text-zinc-500">
                Material Cost
              </p>

              <p className="mt-1 font-mono text-2xl font-bold text-zinc-900">
                {formatPeso(todayMetrics.materialCost)}
              </p>
            </div>

            <div>
              <p className="text-sm text-zinc-500">
                Labor Cost
              </p>

              <p className="mt-1 font-mono text-2xl font-bold text-zinc-900">
                {formatPeso(todayMetrics.laborCost)}
              </p>
            </div>

            <div>
              <p className="text-sm text-zinc-500">
                Profit
              </p>

              <p className="mt-1 font-mono text-2xl font-bold text-green-600">
                {formatPeso(todayMetrics.profit)}
              </p>
            </div>

          </div>

        </div>

        {/* ======================================================
            ACTION NEEDED
            ====================================================== */}

        <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-zinc-900">
              Action Needed
            </h3>

            <p className="mt-1 text-sm text-zinc-500">
              Orders awaiting your attention.
            </p>
          </div>

          {pendingOrdersList.length === 0 &&
          inProductionOrdersList.length === 0 ? (
            <p className="text-sm text-zinc-500">
              All caught up! No pending or active orders.
            </p>
          ) : (
            <div className="space-y-8">

              {/* PENDING */}

              {pendingOrdersList.length > 0 && (
                <div>

                  <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-yellow-600">
                    Pending (Awaiting Confirmation)
                  </h4>

                  <div className="space-y-2">

                    {pendingOrdersList.map((order) => {

                      const daysOld = getDaysOld(order.created_at);
                      const daysLeft = getDaysLeft(
                        order.target_completion_date
                      );

                      return (
                        <Link
                          key={order.id}
                          href={`/orders/${order.order_number}`}
                          className="grid grid-cols-12 items-center gap-4 rounded-lg border border-zinc-100 p-3 transition hover:bg-zinc-50"
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

                          <p className="col-span-2 text-right text-xs text-zinc-400">
                            {daysOld === 0
                              ? "Today"
                              : `${daysOld}d ago`}
                          </p>

                          {daysLeft !== null && (
                            <p
                              className={`col-span-3 text-right text-xs font-medium ${
                                daysLeft < 0
                                  ? "text-red-600"
                                  : daysLeft <= 2
                                  ? "text-orange-600"
                                  : "text-green-600"
                              }`}
                            >
                              {daysLeft < 0
                                ? `${Math.abs(daysLeft)}d overdue`
                                : `${daysLeft}d left`}
                            </p>
                          )}

                        </Link>
                      );
                    })}

                  </div>
                </div>
              )}

              {/* IN PRODUCTION */}

              {inProductionOrdersList.length > 0 && (
                <div>

                  <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-purple-600">
                    In Production (Active Work)
                  </h4>

                  <div className="space-y-2">

                    {inProductionOrdersList.map((order) => {

                      const daysActive = getDaysOld(order.created_at);
                      const daysLeft = getDaysLeft(
                        order.target_completion_date
                      );

                      return (
                        <Link
                          key={order.id}
                          href={`/orders/${order.order_number}`}
                          className="grid grid-cols-12 items-center gap-4 rounded-lg border border-zinc-100 p-3 transition hover:bg-zinc-50"
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

                          <p className="col-span-2 text-right text-xs text-zinc-400">
                            {daysActive === 0
                              ? "Today"
                              : `${daysActive}d active`}
                          </p>

                          {daysLeft !== null && (
                            <p
                              className={`col-span-3 text-right text-xs font-medium ${
                                daysLeft < 0
                                  ? "text-red-600"
                                  : daysLeft <= 2
                                  ? "text-orange-600"
                                  : "text-green-600"
                              }`}
                            >
                              {daysLeft < 0
                                ? `${Math.abs(daysLeft)}d overdue`
                                : `${daysLeft}d left`}
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

        {/* ======================================================
            PRODUCTS SOLD
            ====================================================== */}

        <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-zinc-900">
              Products Sold
            </h3>

            <p className="mt-1 text-sm text-zinc-500">
              Order count by product, excluding cancelled orders.
            </p>
          </div>

          {isLoadingChart ? (
            <p className="text-sm text-zinc-500">
              Loading chart...
            </p>
          ) : productCounts.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No orders yet — this fills in once orders start coming in.
            </p>
          ) : (
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={productCounts}>

                  <CartesianGrid
                    strokeDasharray="4 4"
                    stroke="#e4e4e7"
                  />

                  <XAxis
                    dataKey="product"
                    tick={{
                      fill: "#71717a",
                      fontSize: 12,
                    }}
                  />

                  <YAxis
                    allowDecimals={false}
                    tick={{
                      fill: "#71717a",
                      fontSize: 12,
                    }}
                  />

                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #e4e4e7",  
                      fontSize: 12,
                    }}
                  />

                  <Bar
                    dataKey="count"
                    fill="#18181b"
                    radius={[4, 4, 0, 0]}
                  />

                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

        </div>

      </section>
    </main>
  );
}
