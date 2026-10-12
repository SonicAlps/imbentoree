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
    <main className="min-h-screen bg-white text-black">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 md:py-8">
        <div className="mb-8 border-b border-black pb-7">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Imbentoree
          </p>

          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-black">
                Traffic Handbag Pre-Orders
              </h1>

              <p className="mt-3 text-sm leading-6 text-zinc-600">
                View customer pre-orders and colorway demand.
              </p>
            </div>

            <p className="text-sm text-zinc-500">
              {entries.length} {entries.length === 1 ? "entry" : "entries"}
            </p>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total" value={entries.length} tone="black" />
          <StatCard label="Watermelon" value={watermelonCount} tone="red" />
          <StatCard label="Bubble Gum" value={bubbleGumCount} tone="pink" />
          <StatCard label="Orange + Lime" value={orangeLimeCount} tone="lime" />
        </div>

        <div className="mb-6 border border-black bg-white p-4">
          <label
            htmlFor="waitlist-search"
            className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-zinc-600"
          >
            Search pre-orders
          </label>

          <input
            id="waitlist-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email or colorway..."
            className="w-full border border-black bg-white px-4 py-3 text-sm text-black outline-none placeholder:text-zinc-400 focus:bg-zinc-50 sm:max-w-md"
          />
        </div>

        {loading && (
          <div className="border border-black py-16 text-center text-sm text-zinc-500">
            Loading pre-orders...
          </div>
        )}

        {error && (
          <div className="border border-red-600 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && filteredEntries.length === 0 && (
          <div className="border border-black bg-white py-16 text-center">
            <p className="font-medium text-black">
              No pre-order entries found.
            </p>

            {search.trim() && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="mt-4 border border-black bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-50"
              >
                Clear search
              </button>
            )}
          </div>
        )}

        {!loading && !error && filteredEntries.length > 0 && (
          <>
            <div className="hidden overflow-x-auto border border-black md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-black bg-white">
                  <tr className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-600">
                    <th className="px-5 py-4">Customer</th>
                    <th className="px-5 py-4">Email</th>
                    <th className="px-5 py-4">Colorway</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Joined</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredEntries.map((entry) => (
                    <tr
                      key={entry.id}
                      className="border-t border-zinc-200 transition hover:bg-zinc-50"
                    >
                      <td className="px-5 py-4 font-semibold text-black">
                        {entry.name}
                      </td>

                      <td className="px-5 py-4 text-zinc-600">
                        {entry.email}
                      </td>

                      <td className="px-5 py-4">
                        <ColorwayLabel value={entry.bag_choice} />
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={entry.status} />
                      </td>

                      <td className="px-5 py-4 text-zinc-500">
                        {formatDate(entry.created_at)}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => openDeleteModal(entry.id)}
                          className="border border-red-600 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 md:hidden">
              {filteredEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="border border-black bg-white p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-bold text-black">{entry.name}</p>
                      <p className="mt-1 break-all text-sm text-zinc-600">
                        {entry.email}
                      </p>
                    </div>

                    <StatusBadge status={entry.status} />
                  </div>

                  <div className="mt-5 border-t border-black pt-4">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                        Colorway
                      </span>
                      <ColorwayLabel value={entry.bag_choice} />
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-4">
                      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                        Joined
                      </span>
                      <span className="text-sm text-zinc-600">
                        {formatDate(entry.created_at)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => openDeleteModal(entry.id)}
                      className="mt-5 w-full border border-red-600 bg-white px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50"
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

      {deleteId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 px-4">
          <div className="w-full max-w-sm border border-black bg-white p-6 text-black shadow-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-600">
              Permanent Action
            </p>

            <h2 className="mt-2 text-2xl font-bold tracking-tight">
              Delete pre-order?
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-600">
              This entry will be permanently removed from your pre-order list.
              Enter the admin password to continue.
            </p>

            <div className="mt-5">
              <label
                htmlFor="delete-password"
                className="mb-2 block text-sm font-semibold text-black"
              >
                Admin Password
              </label>

              <input
                id="delete-password"
                type="password"
                value={deletePassword}
                onChange={(e) => {
                  setDeletePassword(e.target.value);
                  if (deleteError) setDeleteError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !deleteLoading) {
                    handleDelete();
                  }
                }}
                placeholder="Enter admin password"
                autoFocus
                disabled={deleteLoading}
                className="w-full border border-black bg-white px-4 py-3 text-black outline-none placeholder:text-zinc-400 focus:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {deleteError && (
              <div className="mt-4 border border-red-600 bg-red-50 px-4 py-3 text-sm text-red-700">
                {deleteError}
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleteLoading}
                className="flex-1 border border-black bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex-1 border border-red-600 bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleteLoading ? "Deleting..." : "Yes, Delete"}
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
  tone = "black",
}: {
  label: string;
  value: number;
  tone?: "black" | "red" | "pink" | "lime";
}) {
  const valueClass =
    tone === "red"
      ? "text-red-600"
      : tone === "pink"
      ? "text-pink-600"
      : tone === "lime"
      ? "text-lime-600"
      : "text-black";

  return (
    <div className="border border-black bg-white p-4 sm:p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
        {label}
      </p>

      <p className={`mt-2 text-4xl font-bold tracking-tight ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}

function ColorwayLabel({ value }: { value: string }) {
  const dotClass =
    value === "Watermelon"
      ? "bg-red-500"
      : value === "Bubble Gum"
      ? "bg-pink-500"
      : value === "Orange and Lime"
      ? "bg-lime-500"
      : "bg-zinc-400";

  return (
    <span className="inline-flex items-center gap-2 text-sm font-semibold text-black">
      <span className={`h-2.5 w-2.5 border border-black ${dotClass}`} />
      {value}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className="inline-flex border border-black bg-white px-2.5 py-1 text-xs font-semibold capitalize text-black">
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