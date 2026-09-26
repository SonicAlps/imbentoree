"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/src/lib/supabase";

type WaitlistEntry = {
  id: string;
  name: string;
  email: string;
  bag_choice: string;
  status: string;
  created_at: string;
};

export default function AdminWaitlistPage() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchWaitlist();
  }, []);

  async function fetchWaitlist() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("waitlist")
      .select("id, name, email, bag_choice, status, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setError("Unable to load waitlist.");
      setLoading(false);
      return;
    }

    setEntries(data ?? []);
    setLoading(false);
  }

  const filteredEntries = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) {
      return entries;
    }

    return entries.filter((entry) => {
      return (
        entry.name.toLowerCase().includes(query) ||
        entry.email.toLowerCase().includes(query) ||
        entry.bag_choice.toLowerCase().includes(query)
      );
    });
  }, [entries, search]);

  const watermelonCount = entries.filter(
    (entry) => entry.bag_choice === "Watermelon"
  ).length;

  const bubbleGumCount = entries.filter(
    (entry) => entry.bag_choice === "Bubble Gum"
  ).length;

  const orangeLimeCount = entries.filter(
    (entry) => entry.bag_choice === "Orange and Lime"
  ).length;

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="mb-8">
          <p className="mb-2 text-sm font-medium text-white/40">
            Imbentoree
          </p>

          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            Traffic Handbag Waitlist
          </h1>

          <p className="mt-3 text-sm text-white/50">
            View customer interest and colorway demand.
          </p>
        </div>

        {/* STATS */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">

          <StatCard
            label="Total"
            value={entries.length}
          />

          <StatCard
            label="Watermelon"
            value={watermelonCount}
          />

          <StatCard
            label="Bubble Gum"
            value={bubbleGumCount}
          />

          <StatCard
            label="Orange + Lime"
            value={orangeLimeCount}
          />

        </div>

        {/* SEARCH */}
        <div className="mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email or colorway..."
            className="
              w-full rounded-xl
              border border-white/10
              bg-white/5
              px-4 py-3
              text-sm text-white
              outline-none
              placeholder:text-white/30
              focus:border-white/30
              sm:max-w-md
            "
          />
        </div>

        {/* LOADING */}
        {loading && (
          <div className="py-16 text-center text-white/40">
            Loading waitlist...
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* EMPTY */}
        {!loading && !error && filteredEntries.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 py-16 text-center">
            <p className="text-white/60">
              No waitlist entries found.
            </p>
          </div>
        )}

        {!loading && !error && filteredEntries.length > 0 && (
          <>
            {/* DESKTOP TABLE */}
            <div className="hidden overflow-hidden rounded-2xl border border-white/10 md:block">
              <table className="w-full text-left">
                <thead className="bg-white/5">
                  <tr className="text-xs uppercase tracking-wider text-white/40">
                    <th className="px-5 py-4 font-semibold">
                      Customer
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Email
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Colorway
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Status
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Joined
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredEntries.map((entry) => (
                    <tr
                      key={entry.id}
                      className="border-t border-white/10 transition hover:bg-white/[0.03]"
                    >
                      <td className="px-5 py-4 font-medium">
                        {entry.name}
                      </td>

                      <td className="px-5 py-4 text-sm text-white/60">
                        {entry.email}
                      </td>

                      <td className="px-5 py-4">
                        {entry.bag_choice}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={entry.status} />
                      </td>

                      <td className="px-5 py-4 text-sm text-white/50">
                        {formatDate(entry.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARDS */}
            <div className="space-y-3 md:hidden">
              {filteredEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-bold">
                        {entry.name}
                      </p>

                      <p className="mt-1 break-all text-sm text-white/50">
                        {entry.email}
                      </p>
                    </div>

                    <StatusBadge status={entry.status} />
                  </div>

                  <div className="mt-5 border-t border-white/10 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-wider text-white/30">
                        Colorway
                      </span>

                      <span className="text-sm font-semibold">
                        {entry.bag_choice}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs uppercase tracking-wider text-white/30">
                        Joined
                      </span>

                      <span className="text-sm text-white/50">
                        {formatDate(entry.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-white/40">
        {label}
      </p>

      <p className="mt-2 text-2xl font-black sm:text-3xl">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  return (
    <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold capitalize text-white/70">
      {status.replace("_", " ")}
    </span>
  );
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateString));
}