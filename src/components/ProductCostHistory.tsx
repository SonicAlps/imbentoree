"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  Pencil,
  Save,
  Trash2,
} from "lucide-react";

import { supabase } from "@/src/lib/supabase";

type CostHistoryRow = {
  id: string;
  product_name: string;
  cost: number;
  effective_from: string;
  created_at: string;
};

type Props = {
  productName: string;

  /*
   * Current calculated cost from Product Costs.
   *
   * Example:
   * materials + labor = 875
   */
  currentCalculatedCost: number;
};

function today() {
  return new Date()
    .toISOString()
    .split("T")[0];
}

function peso(value: number) {
  return new Intl.NumberFormat(
    "en-PH",
    {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    }
  ).format(value);
}

export default function ProductCostHistory({
  productName,
  currentCalculatedCost,
}: Props) {
  const [
    rows,
    setRows,
  ] = useState<CostHistoryRow[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    effectiveDate,
    setEffectiveDate,
  ] = useState(today());

  const [
    editingId,
    setEditingId,
  ] = useState<string | null>(null);

  const [
    editingDate,
    setEditingDate,
  ] = useState("");

  const [
    editingCost,
    setEditingCost,
  ] = useState("");

  useEffect(() => {
    if (!productName) {
      setRows([]);
      return;
    }

    void loadHistory();
  }, [productName]);

  async function loadHistory() {
    setLoading(true);

    const { data, error } =
      await supabase
        .from("product_cost_history")
        .select(
          `
          id,
          product_name,
          cost,
          effective_from,
          created_at
          `
        )
        .eq(
          "product_name",
          productName
        )
        .order(
          "effective_from",
          {
            ascending: false,
          }
        );

    if (error) {
      console.error(
        "Failed to load product cost history:",
        error.message
      );

      alert(
        `Could not load cost history: ${error.message}`
      );

      setRows([]);
    } else {
      setRows(
        ((data || []) as CostHistoryRow[]).map(
          (row) => ({
            ...row,
            cost:
              Number(row.cost) || 0,
          })
        )
      );
    }

    setLoading(false);
  }

  const currentHistoricalCost =
    useMemo(() => {
      const now =
        today();

      const validRows =
        rows
          .filter(
            (row) =>
              row.effective_from <=
              now
          )
          .sort(
            (a, b) =>
              b.effective_from.localeCompare(
                a.effective_from
              )
          );

      return validRows[0] ?? null;
    }, [rows]);

  async function saveCurrentCost() {
    if (!productName) {
      alert(
        "Select a product first."
      );

      return;
    }

    if (
      currentCalculatedCost <= 0
    ) {
      alert(
        "The current calculated cost must be greater than zero."
      );

      return;
    }

    if (!effectiveDate) {
      alert(
        "Please select an effective date."
      );

      return;
    }

    setSaving(true);

    /*
     * Upsert means:
     *
     * same product + same date
     * → update existing record
     *
     * new date
     * → create new record
     */
    const { error } =
      await supabase
        .from(
          "product_cost_history"
        )
        .upsert(
          {
            product_name:
              productName,

            cost:
              currentCalculatedCost,

            effective_from:
              effectiveDate,
          },
          {
            onConflict:
              "product_name,effective_from",
          }
        );

    setSaving(false);

    if (error) {
      console.error(
        "Failed to save product cost:",
        error.message
      );

      alert(
        `Could not save product cost: ${error.message}`
      );

      return;
    }

    await loadHistory();
  }

  function startEdit(
    row: CostHistoryRow
  ) {
    setEditingId(
      row.id
    );

    setEditingDate(
      row.effective_from
    );

    setEditingCost(
      String(row.cost)
    );
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingDate("");
    setEditingCost("");
  }

  async function saveEdit() {
    if (!editingId) {
      return;
    }

    const parsedCost =
      Number(editingCost);

    if (
      !parsedCost ||
      parsedCost <= 0
    ) {
      alert(
        "Enter a valid cost."
      );

      return;
    }

    if (!editingDate) {
      alert(
        "Choose an effective date."
      );

      return;
    }

    const { error } =
      await supabase
        .from(
          "product_cost_history"
        )
        .update({
          cost:
            parsedCost,

          effective_from:
            editingDate,
        })
        .eq(
          "id",
          editingId
        );

    if (error) {
      console.error(
        "Failed to edit cost history:",
        error.message
      );

      alert(
        `Could not update history: ${error.message}`
      );

      return;
    }

    cancelEdit();

    await loadHistory();
  }

  async function deleteHistory(
    id: string
  ) {
    const confirmed =
      window.confirm(
        "Delete this historical cost?"
      );

    if (!confirmed) {
      return;
    }

    const { error } =
      await supabase
        .from(
          "product_cost_history"
        )
        .delete()
        .eq(
          "id",
          id
        );

    if (error) {
      alert(
        `Could not delete history: ${error.message}`
      );

      return;
    }

    await loadHistory();
  }

  if (!productName) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-sm text-zinc-500">
        Select a product first.
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* SAVE CURRENT COST */}

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">

        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

          <div>

            <p className="text-sm font-medium text-zinc-500">
              {productName}
            </p>

            <h2 className="mt-1 text-2xl font-semibold text-zinc-950">
              Current Calculated Cost
            </h2>

            <p className="mt-3 text-3xl font-bold tracking-tight text-zinc-950">
              {peso(
                currentCalculatedCost
              )}
            </p>

            {currentHistoricalCost ? (

              <p className="mt-2 text-sm text-zinc-500">
                Current saved cost is{" "}
                <span className="font-medium text-zinc-700">
                  {peso(
                    currentHistoricalCost.cost
                  )}
                </span>{" "}
                effective{" "}
                {new Date(
                  `${currentHistoricalCost.effective_from}T00:00:00`
                ).toLocaleDateString(
                  "en-PH",
                  {
                    year:
                      "numeric",
                    month:
                      "long",
                    day:
                      "numeric",
                  }
                )}
                .
              </p>

            ) : (

              <p className="mt-2 text-sm text-amber-700">
                No historical cost
                has been saved yet.
              </p>

            )}

          </div>

          <div className="w-full max-w-md">

            <label className="text-sm font-medium text-zinc-700">
              Effective Date
            </label>

            <input
              type="date"
              value={
                effectiveDate
              }
              onChange={(event) =>
                setEffectiveDate(
                  event.target.value
                )
              }
              className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3"
            />

            <button
              type="button"
              onClick={
                saveCurrentCost
              }
              disabled={
                saving ||
                currentCalculatedCost <=
                  0
              }
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Save
                size={16}
              />

              {saving
                ? "Saving..."
                : "Save Current Cost"}
            </button>

          </div>

        </div>

      </section>

      {/* HISTORY */}

      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">

        <div className="border-b border-zinc-200 px-6 py-4">

          <h2 className="font-semibold text-zinc-950">
            Cost History
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Each cost remains active
            until a newer effective date
            is added.
          </p>

        </div>

        {loading ? (

          <p className="p-6 text-sm text-zinc-500">
            Loading history...
          </p>

        ) : rows.length === 0 ? (

          <div className="px-6 py-12 text-center text-sm text-zinc-500">
            No saved costs for{" "}
            {productName}.
          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full min-w-[650px] text-left text-sm">

              <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">

                <tr>

                  <th className="px-5 py-3">
                    Effective Date
                  </th>

                  <th className="px-5 py-3 text-right">
                    Cost
                  </th>

                  <th className="px-5 py-3 text-right">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-zinc-100">

                {rows.map(
                  (row) => {

                    const editing =
                      editingId ===
                      row.id;

                    return (
                      <tr
                        key={row.id}
                      >

                        <td className="px-5 py-4">

                          {editing ? (

                            <input
                              type="date"
                              value={
                                editingDate
                              }
                              onChange={(
                                event
                              ) =>
                                setEditingDate(
                                  event.target.value
                                )
                              }
                              className="rounded-lg border border-zinc-300 px-3 py-2"
                            />

                          ) : (

                            <div className="flex items-center gap-2">

                              <CalendarDays
                                size={14}
                                className="text-zinc-400"
                              />

                              {new Date(
                                `${row.effective_from}T00:00:00`
                              ).toLocaleDateString(
                                "en-PH",
                                {
                                  year:
                                    "numeric",
                                  month:
                                    "long",
                                  day:
                                    "numeric",
                                }
                              )}

                            </div>

                          )}

                        </td>

                        <td className="px-5 py-4 text-right font-medium">

                          {editing ? (

                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={
                                editingCost
                              }
                              onChange={(
                                event
                              ) =>
                                setEditingCost(
                                  event.target.value
                                )
                              }
                              className="w-36 rounded-lg border border-zinc-300 px-3 py-2 text-right"
                            />

                          ) : (

                            peso(
                              row.cost
                            )

                          )}

                        </td>

                        <td className="px-5 py-4">

                          <div className="flex justify-end gap-2">

                            {editing ? (
                              <>

                                <button
                                  type="button"
                                  onClick={
                                    saveEdit
                                  }
                                  className="rounded-lg bg-zinc-950 px-3 py-2 text-xs font-medium text-white"
                                >
                                  Save
                                </button>

                                <button
                                  type="button"
                                  onClick={
                                    cancelEdit
                                  }
                                  className="rounded-lg border border-zinc-300 px-3 py-2 text-xs font-medium"
                                >
                                  Cancel
                                </button>

                              </>
                            ) : (
                              <>

                                <button
                                  type="button"
                                  onClick={() =>
                                    startEdit(
                                      row
                                    )
                                  }
                                  className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100"
                                  aria-label="Edit historical cost"
                                >
                                  <Pencil
                                    size={16}
                                  />
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    deleteHistory(
                                      row.id
                                    )
                                  }
                                  className="rounded-lg p-2 text-zinc-400 hover:bg-red-50 hover:text-red-600"
                                  aria-label="Delete historical cost"
                                >
                                  <Trash2
                                    size={16}
                                  />
                                </button>

                              </>
                            )}

                          </div>

                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>

        )}

      </section>

    </div>
  );
}