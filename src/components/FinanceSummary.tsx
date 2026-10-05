"use client";

import Link from "next/link";
import {
  ArrowRight,
  CircleDollarSign,
  ReceiptText,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "@/src/lib/supabase";
import {
  calculateFinanceSummary,
  getOrderDate,
  peso,
  type Expense,
  type FinanceOrder,
} from "@/src/lib/finance";

export function FinanceSummary() {
  const [orders, setOrders] = useState<FinanceOrder[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    try {
      const [ordersResponse, expensesResponse] =
        await Promise.all([
          supabase
            .from("orders")
            .select("*")
            .eq("status", "completed"),

          supabase
            .from("expenses")
            .select("*"),
        ]);

      setOrders(
        (ordersResponse.data ?? []) as FinanceOrder[]
      );

      setExpenses(
        (expensesResponse.data ?? []) as Expense[]
      );
    } finally {
      setLoading(false);
    }
  }

  const thisMonthOrders = useMemo(() => {
    const now = new Date();

    return orders.filter((order) => {
      const date = new Date(
        getOrderDate(order)
      );

      return (
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth()
      );
    });
  }, [orders]);

  const thisMonthExpenses = useMemo(() => {
    const now = new Date();

    return expenses.filter((expense) => {
      const date = new Date(
        `${expense.expense_date}T00:00:00`
      );

      return (
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth()
      );
    });
  }, [expenses]);

  const summary = useMemo(
    () =>
      calculateFinanceSummary(
        thisMonthOrders,
        thisMonthExpenses
      ),
    [
      thisMonthOrders,
      thisMonthExpenses,
    ]
  );

  if (loading) {
    return (
      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <p className="text-sm text-zinc-500">
          Loading finance summary...
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">

      <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">

        <div>
          <h2 className="font-semibold text-zinc-950">
            Finance
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            This month
          </p>
        </div>

        <Link
          href="/finances"
          className="flex items-center gap-1 text-sm font-medium text-zinc-600 transition hover:text-zinc-950"
        >
          View details
          <ArrowRight size={15} />
        </Link>

      </div>

      <div className="grid gap-px bg-zinc-200 sm:grid-cols-2 xl:grid-cols-4">

        <MiniStat
          title="Revenue"
          value={peso(summary.revenue)}
          icon={<CircleDollarSign size={17} />}
        />

        <MiniStat
          title="Gross Profit"
          value={peso(summary.grossProfit)}
          icon={<TrendingUp size={17} />}
        />

        <MiniStat
          title="Expenses"
          value={peso(summary.operatingExpenses)}
          icon={<ReceiptText size={17} />}
        />

        <MiniStat
          title="Estimated Net"
          value={peso(summary.netProfit)}
          icon={<WalletCards size={17} />}
        />

      </div>

    </section>
  );
}

function MiniStat({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white p-5">

      <div className="flex items-center gap-2 text-zinc-500">
        {icon}

        <span className="text-xs font-medium">
          {title}
        </span>
      </div>

      <p className="mt-3 text-xl font-semibold tracking-tight text-zinc-950">
        {value}
      </p>

    </div>
  );
}