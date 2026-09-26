"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/src/lib/supabase";

type Order = {
  id: string;
  order_number: string;
  customer_name: string;
  product: string;
  price: number;
  status: string;
  created_at: string;
};

type Liquidation = {
  id: string;
  order_id: string;
  status: "draft" | "finalized";
  material_cost: number;
  labor_cost: number;
  total_production_cost: number;
  profit: number;
  profit_margin: number;
  finalized_at: string | null;
};

type LiquidationState = "awaiting" | "draft" | "finalized";

type ProductionJob = {
  order: Order;
  liquidation: Liquidation | null;
  liquidationState: LiquidationState;
};

function formatCurrency(value: number | null | undefined) {
  return `₱${Number(value ?? 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function LiquidationPage() {
  const router = useRouter();

  const [jobs, setJobs] = useState<ProductionJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] =
    useState<"all" | LiquidationState>("all");

  useEffect(() => {
    async function fetchProductionJobs() {
      setIsLoading(true);

      /*
       * Orders are the production jobs.
       *
       * Cancelled orders are excluded because there is
       * nothing to liquidate.
       */
      const { data: ordersData, error: ordersError } =
        await supabase
          .from("orders")
          .select(
            "id, order_number, customer_name, product, price, status, created_at"
          )
          .neq("status", "cancelled")
          .order("created_at", { ascending: false });

      if (ordersError) {
        console.error(
          "Failed to fetch orders:",
          ordersError.message
        );

        setIsLoading(false);
        return;
      }

      /*
       * Get existing liquidation records.
       */
      const {
        data: liquidationData,
        error: liquidationError,
      } = await supabase
        .from("order_liquidations")
        .select(
          `
          id,
          order_id,
          status,
          material_cost,
          labor_cost,
          total_production_cost,
          profit,
          profit_margin,
          finalized_at
          `
        );

      if (liquidationError) {
        console.error(
          "Failed to fetch liquidations:",
          liquidationError.message
        );

        setIsLoading(false);
        return;
      }

      const orders = (ordersData ?? []) as Order[];
      const liquidations =
        (liquidationData ?? []) as Liquidation[];

      const liquidationMap = new Map<
        string,
        Liquidation
      >();

      liquidations.forEach((liquidation) => {
        liquidationMap.set(
          liquidation.order_id,
          liquidation
        );
      });

      const productionJobs: ProductionJob[] =
        orders.map((order) => {
          const liquidation =
            liquidationMap.get(order.id) ?? null;

          let liquidationState: LiquidationState =
            "awaiting";

          if (liquidation?.status === "draft") {
            liquidationState = "draft";
          }

          if (liquidation?.status === "finalized") {
            liquidationState = "finalized";
          }

          return {
            order,
            liquidation,
            liquidationState,
          };
        });

      setJobs(productionJobs);
      setIsLoading(false);
    }

    fetchProductionJobs();
  }, []);

  const awaitingCount = jobs.filter(
    (job) => job.liquidationState === "awaiting"
  ).length;

  const draftCount = jobs.filter(
    (job) => job.liquidationState === "draft"
  ).length;

  const finalizedCount = jobs.filter(
    (job) => job.liquidationState === "finalized"
  ).length;

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (
        activeTab !== "all" &&
        job.liquidationState !== activeTab
      ) {
        return false;
      }

      const query = searchQuery
        .trim()
        .toLowerCase();

      if (!query) return true;

      return (
        job.order.order_number
          .toLowerCase()
          .includes(query) ||
        job.order.customer_name
          .toLowerCase()
          .includes(query) ||
        job.order.product
          .toLowerCase()
          .includes(query)
      );
    });
  }, [jobs, activeTab, searchQuery]);

  const awaitingJobs = filteredJobs.filter(
    (job) => job.liquidationState === "awaiting"
  );

  const draftJobs = filteredJobs.filter(
    (job) => job.liquidationState === "draft"
  );

  const finalizedJobs = filteredJobs.filter(
    (job) => job.liquidationState === "finalized"
  );

  function openLiquidation(job: ProductionJob) {
    router.push(
      `/liquidation/${job.order.order_number}`
    );
  }

  function renderAwaitingJob(job: ProductionJob) {
    return (
      <div
        key={job.order.id}
        className="rounded-2xl border bg-white p-6"
      >
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <p className="font-mono text-sm font-semibold text-zinc-900">
                {job.order.order_number}
              </p>

              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                Awaiting Liquidation
              </span>
            </div>

            <h3 className="mt-3 text-xl font-semibold tracking-tight text-zinc-900">
              {job.order.product}
            </h3>

            <p className="mt-1 text-sm text-zinc-500">
              {job.order.customer_name}
            </p>

            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-zinc-400">
              <span>
                Order value{" "}
                <strong className="font-medium text-zinc-700">
                  {formatCurrency(job.order.price)}
                </strong>
              </span>

              <span>
                Order status{" "}
                <strong className="font-medium capitalize text-zinc-700">
                  {job.order.status.replace("_", " ")}
                </strong>
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => openLiquidation(job)}
            className="shrink-0 rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-700"
          >
            Liquidate →
          </button>
        </div>
      </div>
    );
  }

  function renderDraftJob(job: ProductionJob) {
    const liquidation = job.liquidation;

    return (
      <div
        key={job.order.id}
        className="rounded-2xl border bg-white p-6"
      >
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <p className="font-mono text-sm font-semibold text-zinc-900">
                {job.order.order_number}
              </p>

              <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-800">
                Draft
              </span>
            </div>

            <h3 className="mt-3 text-xl font-semibold tracking-tight text-zinc-900">
              {job.order.product}
            </h3>

            <p className="mt-1 text-sm text-zinc-500">
              {job.order.customer_name}
            </p>

            <div className="mt-5 flex flex-wrap gap-x-8 gap-y-3">
              <div>
                <p className="text-xs text-zinc-400">
                  Materials
                </p>
                <p className="mt-1 text-sm font-semibold text-zinc-900">
                  {formatCurrency(
                    liquidation?.material_cost
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs text-zinc-400">
                  Labor
                </p>
                <p className="mt-1 text-sm font-semibold text-zinc-900">
                  {formatCurrency(
                    liquidation?.labor_cost
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs text-zinc-400">
                  Current Cost
                </p>
                <p className="mt-1 text-sm font-semibold text-zinc-900">
                  {formatCurrency(
                    liquidation?.total_production_cost
                  )}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => openLiquidation(job)}
            className="shrink-0 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Continue →
          </button>
        </div>
      </div>
    );
  }

  function renderFinalizedJob(job: ProductionJob) {
    const liquidation = job.liquidation;

    return (
      <div
        key={job.order.id}
        className="rounded-2xl border bg-white p-6"
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_repeat(3,minmax(110px,0.5fr))_auto] lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="font-mono text-sm font-semibold text-zinc-900">
                {job.order.order_number}
              </p>

              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">
                Finalized
              </span>
            </div>

            <h3 className="mt-2 font-semibold text-zinc-900">
              {job.order.product}
            </h3>

            <p className="mt-1 text-xs text-zinc-400">
              {formatDate(
                liquidation?.finalized_at
              )}
            </p>
          </div>

          <div>
            <p className="text-xs text-zinc-400">
              Cost
            </p>

            <p className="mt-1 font-semibold text-zinc-900">
              {formatCurrency(
                liquidation?.total_production_cost
              )}
            </p>
          </div>

          <div>
            <p className="text-xs text-zinc-400">
              Profit
            </p>

            <p className="mt-1 font-semibold text-zinc-900">
              {formatCurrency(
                liquidation?.profit
              )}
            </p>
          </div>

          <div>
            <p className="text-xs text-zinc-400">
              Margin
            </p>

            <p className="mt-1 font-semibold text-zinc-900">
              {Number(
                liquidation?.profit_margin ?? 0
              ).toFixed(1)}
              %
            </p>
          </div>

          <button
            type="button"
            onClick={() => openLiquidation(job)}
            className="rounded-lg border px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            View
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      {/* HEADER */}
      <div className="mb-10">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
          Production Closeout
        </p>

        <h1 className="mt-2 text-4xl font-bold tracking-tight text-white">
          Liquidation
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
          Record what was actually consumed during
          production and close out the true cost of
          each bag.
        </p>
      </div>

      {/* SUMMARY */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <button
          type="button"
          onClick={() =>
            setActiveTab(
              activeTab === "awaiting"
                ? "all"
                : "awaiting"
            )
          }
          className={`rounded-2xl border p-6 text-left transition ${
            activeTab === "awaiting"
              ? "border-white bg-white"
              : "border-zinc-700 bg-zinc-900 hover:border-zinc-500"
          }`}
        >
          <p
            className={`text-xs font-semibold uppercase tracking-[0.15em] ${
              activeTab === "awaiting"
                ? "text-zinc-500"
                : "text-zinc-500"
            }`}
          >
            Awaiting
          </p>

          <p
            className={`mt-3 text-4xl font-bold ${
              activeTab === "awaiting"
                ? "text-zinc-900"
                : "text-white"
            }`}
          >
            {awaitingCount}
          </p>

          <p
            className={`mt-2 text-xs ${
              activeTab === "awaiting"
                ? "text-zinc-500"
                : "text-zinc-500"
            }`}
          >
            Not yet liquidated
          </p>
        </button>

        <button
          type="button"
          onClick={() =>
            setActiveTab(
              activeTab === "draft"
                ? "all"
                : "draft"
            )
          }
          className={`rounded-2xl border p-6 text-left transition ${
            activeTab === "draft"
              ? "border-white bg-white"
              : "border-zinc-700 bg-zinc-900 hover:border-zinc-500"
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
            Drafts
          </p>

          <p
            className={`mt-3 text-4xl font-bold ${
              activeTab === "draft"
                ? "text-zinc-900"
                : "text-white"
            }`}
          >
            {draftCount}
          </p>

          <p className="mt-2 text-xs text-zinc-500">
            Started, not finalized
          </p>
        </button>

        <button
          type="button"
          onClick={() =>
            setActiveTab(
              activeTab === "finalized"
                ? "all"
                : "finalized"
            )
          }
          className={`rounded-2xl border p-6 text-left transition ${
            activeTab === "finalized"
              ? "border-white bg-white"
              : "border-zinc-700 bg-zinc-900 hover:border-zinc-500"
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
            Finalized
          </p>

          <p
            className={`mt-3 text-4xl font-bold ${
              activeTab === "finalized"
                ? "text-zinc-900"
                : "text-white"
            }`}
          >
            {finalizedCount}
          </p>

          <p className="mt-2 text-xs text-zinc-500">
            Production costs frozen
          </p>
        </button>
      </div>

      {/* SEARCH */}
      <div className="mb-10">
        <input
          type="search"
          value={searchQuery}
          onChange={(e) =>
            setSearchQuery(e.target.value)
          }
          placeholder="Search Bag ID, product, or customer..."
          className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-500"
        />
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-10">
          <p className="text-sm text-zinc-400">
            Loading production records...
          </p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-12 text-center">
          <p className="font-medium text-white">
            Nothing here.
          </p>

          <p className="mt-2 text-sm text-zinc-500">
            No production records match this view.
          </p>
        </div>
      ) : (
        <div className="space-y-12">
          {/* AWAITING */}
          {(activeTab === "all" ||
            activeTab === "awaiting") &&
            awaitingJobs.length > 0 && (
              <section>
                <div className="mb-4 flex items-end justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-amber-400">
                      Action Needed
                    </p>

                    <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white">
                      Needs Liquidation
                    </h2>
                  </div>

                  <span className="text-sm text-zinc-500">
                    {awaitingJobs.length}{" "}
                    {awaitingJobs.length === 1
                      ? "bag"
                      : "bags"}
                  </span>
                </div>

                <div className="space-y-3">
                  {awaitingJobs.map(
                    renderAwaitingJob
                  )}
                </div>
              </section>
            )}

          {/* DRAFTS */}
          {(activeTab === "all" ||
            activeTab === "draft") &&
            draftJobs.length > 0 && (
              <section>
                <div className="mb-4 flex items-end justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-400">
                      In Progress
                    </p>

                    <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white">
                      Draft Liquidations
                    </h2>
                  </div>

                  <span className="text-sm text-zinc-500">
                    {draftJobs.length}{" "}
                    {draftJobs.length === 1
                      ? "draft"
                      : "drafts"}
                  </span>
                </div>

                <div className="space-y-3">
                  {draftJobs.map(renderDraftJob)}
                </div>
              </section>
            )}

          {/* FINALIZED */}
          {(activeTab === "all" ||
            activeTab === "finalized") &&
            finalizedJobs.length > 0 && (
              <section>
                <div className="mb-4 flex items-end justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-400">
                      Closed
                    </p>

                    <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white">
                      Finalized
                    </h2>
                  </div>

                  <span className="text-sm text-zinc-500">
                    {finalizedJobs.length}{" "}
                    {finalizedJobs.length === 1
                      ? "record"
                      : "records"}
                  </span>
                </div>

                <div className="space-y-3">
                  {finalizedJobs.map(
                    renderFinalizedJob
                  )}
                </div>
              </section>
            )}
        </div>
      )}
    </div>
  );
}