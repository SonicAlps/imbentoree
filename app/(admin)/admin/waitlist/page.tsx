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

  const [deletePassword, setDeletePassword] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

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
      setError("Unable to load pre-orders.");
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

  function openDeleteModal(id: string) {
    setDeleteId(id);
    setDeletePassword("");
    setDeleteError("");
  }

  function closeDeleteModal() {
    if (deleteLoading) return;

    setDeleteId(null);
    setDeletePassword("");
    setDeleteError("");
  }

  async function handleDelete() {
    if (!deleteId) return;

    if (!deletePassword.trim()) {
      setDeleteError("Enter the admin password.");
      return;
    }

    setDeleteLoading(true);
    setDeleteError("");

    try {
      const response = await fetch("/api/admin/waitlist/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: deleteId,
          password: deletePassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setDeleteError(
          data.error || "Could not delete the pre-order."
        );
        return;
      }

      setEntries((current) =>
        current.filter((entry) => entry.id !== deleteId)
      );

      setDeleteId(null);
      setDeletePassword("");
      setDeleteError("");
    } catch (error) {
      console.error(error);

      setDeleteError(
        "Something went wrong while deleting the pre-order."
      );
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="mb-8">
          <p className="mb-2 text-sm font-medium text-white/40">
            Imbentoree
          </p>

          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            Traffic Handbag Pre-Orders
          </h1>

          <p className="mt-3 text-sm text-white/50">
            View customer pre-orders and colorway demand.
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
              w-full
              rounded-xl
              border border-white/10
              bg-white/5
              px-4
              py-3
              text-sm
              text-white
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
            Loading pre-orders...
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* EMPTY */}
        {!loading &&
          !error &&
          filteredEntries.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 py-16 text-center">
              <p className="text-white/60">
                No pre-order entries found.
              </p>
            </div>
          )}

        {!loading &&
          !error &&
          filteredEntries.length > 0 && (
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

                      <th className="px-5 py-4 text-right font-semibold">
                        Actions
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

                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              openDeleteModal(entry.id)
                            }
                            className="
                              rounded-lg
                              border border-red-500/20
                              px-3
                              py-2
                              text-xs
                              font-semibold
                              text-red-400
                              transition
                              hover:border-red-500/40
                              hover:bg-red-500/10
                              hover:text-red-300
                            "
                          >
                            Delete
                          </button>
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

                      <button
                        type="button"
                        onClick={() =>
                          openDeleteModal(entry.id)
                        }
                        className="
                          mt-5
                          w-full
                          rounded-xl
                          border border-red-500/20
                          px-4
                          py-3
                          text-sm
                          font-semibold
                          text-red-400
                          transition
                          hover:bg-red-500/10
                        "
                      >
                        Delete Pre-Order
                      </button>

                    </div>
                  </div>
                ))}
              </div>

            </>
          )}
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {deleteId && (
        <div
          className="
            fixed
            inset-0
            z-[100]
            flex
            items-center
            justify-center
            bg-black/80
            px-4
            backdrop-blur-sm
          "
        >
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-400">
                Permanent Action
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Delete pre-order?
              </h2>

              <p className="mt-2 text-sm leading-6 text-white/50">
                This entry will be permanently removed from your
                pre-order list. Enter the admin password to continue.
              </p>
            </div>

            {/* PASSWORD */}
            <div className="mt-5">
              <label
                htmlFor="delete-password"
                className="mb-2 block text-sm font-semibold text-white/80"
              >
                Admin Password
              </label>

              <input
                id="delete-password"
                type="password"
                value={deletePassword}
                onChange={(e) => {
                  setDeletePassword(e.target.value);

                  if (deleteError) {
                    setDeleteError("");
                  }
                }}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    !deleteLoading
                  ) {
                    handleDelete();
                  }
                }}
                placeholder="Enter admin password"
                autoFocus
                disabled={deleteLoading}
                className="
                  w-full
                  rounded-xl
                  border border-white/15
                  bg-white/5
                  px-4
                  py-3
                  text-white
                  outline-none
                  transition
                  placeholder:text-white/25
                  focus:border-white/40
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              />
            </div>

            {deleteError && (
              <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {deleteError}
              </div>
            )}

            <div className="mt-6 flex gap-3">

              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleteLoading}
                className="
                  flex-1
                  rounded-xl
                  border border-white/10
                  px-4
                  py-3
                  text-sm
                  font-semibold
                  text-white/70
                  transition
                  hover:bg-white/5
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteLoading}
                className="
                  flex-1
                  rounded-xl
                  bg-red-600
                  px-4
                  py-3
                  text-sm
                  font-bold
                  text-white
                  transition
                  hover:bg-red-500
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                {deleteLoading
                  ? "Deleting..."
                  : "Yes, Delete"}
              </button>

            </div>

          </div>
        </div>
      )}

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