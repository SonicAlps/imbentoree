"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/src/lib/supabase";

type Order = {
  id: string;
  order_number: string;
  customer_name: string;
  product: string;
  price: number;
  status: string;
};

type Material = {
  id: string;
  name: string;
  unit: string;
  cost_per_unit: number;
  material_type?: string | null;
};

type MaterialRow = {
  rowId: number;
  materialId: string;
  quantity: number;
};

type LiquidationFormProps = {
  order: Order;
};

export default function LiquidationForm({
  order,
}: LiquidationFormProps) {
  const [materials, setMaterials] = useState<Material[]>([]);

  const [materialRows, setMaterialRows] = useState<
    MaterialRow[]
  >([
    {
      rowId: 1,
      materialId: "",
      quantity: 0,
    },
  ]);

  const [laborCost, setLaborCost] = useState(0);

  const [isLoadingMaterials, setIsLoadingMaterials] =
    useState(true);

  const [isSaving, setIsSaving] = useState(false);

  const [message, setMessage] = useState("");

  useEffect(() => {
    async function fetchMaterials() {
      setIsLoadingMaterials(true);

      const { data, error } = await supabase
        .from("materials")
        .select(
          "id, name, unit, cost_per_unit, material_type"
        )
        .order("name", { ascending: true });

      if (error) {
        console.error(
          "Failed to fetch materials:",
          error.message
        );

        setMessage(
          `Could not load materials: ${error.message}`
        );

        setIsLoadingMaterials(false);
        return;
      }

      setMaterials((data ?? []) as Material[]);
      setIsLoadingMaterials(false);
    }

    fetchMaterials();
  }, []);

  function getMaterial(materialId: string) {
    return materials.find(
      (material) => material.id === materialId
    );
  }

  function addMaterialRow() {
    setMaterialRows((current) => [
      ...current,
      {
        rowId: Date.now(),
        materialId: "",
        quantity: 0,
      },
    ]);
  }

  function removeMaterialRow(rowId: number) {
    setMaterialRows((current) => {
      if (current.length === 1) {
        return current;
      }

      return current.filter(
        (row) => row.rowId !== rowId
      );
    });
  }

  function updateMaterial(
    rowId: number,
    materialId: string
  ) {
    setMaterialRows((current) =>
      current.map((row) =>
        row.rowId === rowId
          ? {
              ...row,
              materialId,
            }
          : row
      )
    );
  }

  function updateQuantity(
    rowId: number,
    quantity: number
  ) {
    setMaterialRows((current) =>
      current.map((row) =>
        row.rowId === rowId
          ? {
              ...row,
              quantity,
            }
          : row
      )
    );
  }

  const materialCost = useMemo(() => {
    return materialRows.reduce((total, row) => {
      const material = getMaterial(row.materialId);

      if (!material) {
        return total;
      }

      return (
        total +
        Number(row.quantity || 0) *
          Number(material.cost_per_unit || 0)
      );
    }, 0);
  }, [materialRows, materials]);

  const totalProductionCost =
    materialCost + Number(laborCost || 0);

  const profit =
    Number(order.price || 0) - totalProductionCost;

  const profitMargin =
    Number(order.price || 0) > 0
      ? (profit / Number(order.price)) * 100
      : 0;

  async function saveLiquidation(
    finalStatus: "draft" | "finalized"
  ) {
    setMessage("");

    const validRows = materialRows.filter(
      (row) =>
        row.materialId &&
        Number(row.quantity) > 0
    );

    if (validRows.length === 0) {
      setMessage(
        "Add at least one material with a quantity."
      );
      return;
    }

    setIsSaving(true);

    try {
      /*
       * Check whether this order already has
       * a liquidation record.
       */
      const { data: existing, error: existingError } =
        await supabase
          .from("order_liquidations")
          .select("id")
          .eq("order_id", order.id)
          .maybeSingle();

      if (existingError) {
        throw existingError;
      }

      let liquidationId: string;

      const liquidationPayload = {
        order_id: order.id,
        status: finalStatus,
        labor_cost: Number(laborCost || 0),
        material_cost: materialCost,
        total_production_cost: totalProductionCost,
        profit,
        profit_margin: profitMargin,
        finalized_at:
          finalStatus === "finalized"
            ? new Date().toISOString()
            : null,
      };

      if (existing) {
        const { error: updateError } = await supabase
          .from("order_liquidations")
          .update(liquidationPayload)
          .eq("id", existing.id);

        if (updateError) {
          throw updateError;
        }

        liquidationId = existing.id;

        /*
         * Replace the old draft material rows
         * with the current form contents.
         */
        const { error: deleteError } = await supabase
          .from("liquidation_materials")
          .delete()
          .eq("liquidation_id", liquidationId);

        if (deleteError) {
          throw deleteError;
        }
      } else {
        const { data: created, error: createError } =
          await supabase
            .from("order_liquidations")
            .insert(liquidationPayload)
            .select("id")
            .single();

        if (createError || !created) {
          throw (
            createError ??
            new Error(
              "Could not create liquidation."
            )
          );
        }

        liquidationId = created.id;
      }

      /*
       * Snapshot the materials and their costs.
       * We deliberately store the cost used today,
       * rather than relying on the future Materials
       * price.
       */
      const liquidationMaterials = validRows.map(
        (row) => {
          const material = getMaterial(
            row.materialId
          );

          if (!material) {
            throw new Error(
              "A selected material could not be found."
            );
          }

          const quantity = Number(row.quantity);

          const frozenUnitCost = Number(
            material.cost_per_unit || 0
          );

          return {
            liquidation_id: liquidationId,
            material_id: material.id,

            material_name_snapshot: material.name,

            material_type_snapshot:
              material.material_type ?? null,

            unit_snapshot: material.unit,

            quantity_used: quantity,

            unit_cost_snapshot: frozenUnitCost,

            total_cost:
              quantity * frozenUnitCost,
          };
        }
      );

      const { error: materialInsertError } =
        await supabase
          .from("liquidation_materials")
          .insert(liquidationMaterials);

      if (materialInsertError) {
        throw materialInsertError;
      }

      /*
       * When finalized, also write the frozen
       * aggregate numbers back to orders.
       *
       * This preserves compatibility with your
       * current Dashboard.
       */
      if (finalStatus === "finalized") {
        const { error: orderUpdateError } =
          await supabase
            .from("orders")
            .update({
              material_cost: materialCost,
              labor_cost: Number(laborCost || 0),
              total_production_cost:
                totalProductionCost,
              profit,
              profit_margin: profitMargin,
            })
            .eq("id", order.id);

        if (orderUpdateError) {
          throw orderUpdateError;
        }
      }

      setMessage(
        finalStatus === "finalized"
          ? "Liquidation finalized successfully."
          : "Liquidation draft saved."
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error";

      console.error(
        "Liquidation save failed:",
        error
      );

      setMessage(
        `Could not save liquidation: ${message}`
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* ORDER SUMMARY */}
      <section className="rounded-2xl border bg-white p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-400">
          Production Record
        </p>

        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          <div>
            <p className="text-xs text-zinc-400">
              Bag ID
            </p>

            <p className="mt-1 font-mono text-sm font-semibold text-zinc-900">
              {order.order_number}
            </p>
          </div>

          <div>
            <p className="text-xs text-zinc-400">
              Product
            </p>

            <p className="mt-1 text-sm font-semibold text-zinc-900">
              {order.product}
            </p>
          </div>

          <div>
            <p className="text-xs text-zinc-400">
              Selling Price
            </p>

            <p className="mt-1 text-sm font-semibold text-zinc-900">
              ₱{Number(order.price ?? 0).toFixed(2)}
            </p>
          </div>
        </div>
      </section>

      {/* MATERIALS */}
      <section className="rounded-2xl border bg-white p-8">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-400">
              Actual Materials
            </p>

            <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-900">
              Materials Used
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Enter what was actually consumed while
              making this bag.
            </p>
          </div>

          <button
            type="button"
            onClick={addMaterialRow}
            className="shrink-0 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700"
          >
            + Material
          </button>
        </div>

        <div className="mt-8 space-y-4">
          {materialRows.map((row) => {
            const selectedMaterial =
              getMaterial(row.materialId);

            const rowCost = selectedMaterial
              ? Number(row.quantity || 0) *
                Number(
                  selectedMaterial.cost_per_unit || 0
                )
              : 0;

            return (
              <div
                key={row.rowId}
                className="rounded-xl border bg-zinc-50 p-5"
              >
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px_130px_50px] lg:items-end">
                  {/* MATERIAL */}
                  <div>
                    <label className="mb-2 block text-xs font-medium text-zinc-500">
                      Material
                    </label>

                    <select
                      value={row.materialId}
                      onChange={(e) =>
                        updateMaterial(
                          row.rowId,
                          e.target.value
                        )
                      }
                      disabled={isLoadingMaterials}
                      className="w-full rounded-lg border bg-white px-3 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-400"
                    >
                      <option value="">
                        {isLoadingMaterials
                          ? "Loading materials..."
                          : "Select material"}
                      </option>

                      {materials.map((material) => (
                        <option
                          key={material.id}
                          value={material.id}
                        >
                          {material.name}
                          {material.material_type
                            ? ` · ${material.material_type}`
                            : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* QUANTITY */}
                  <div>
                    <label className="mb-2 block text-xs font-medium text-zinc-500">
                      Actual Used
                    </label>

                    <div className="flex">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          row.quantity === 0
                            ? ""
                            : row.quantity
                        }
                        onChange={(e) =>
                          updateQuantity(
                            row.rowId,
                            Number(e.target.value)
                          )
                        }
                        placeholder="0"
                        className="min-w-0 flex-1 rounded-l-lg border border-r-0 bg-white px-3 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-400"
                      />

                      <div className="flex items-center rounded-r-lg border bg-zinc-100 px-3 text-xs text-zinc-500">
                        {selectedMaterial?.unit ?? "unit"}
                      </div>
                    </div>
                  </div>

                  {/* COST */}
                  <div>
                    <p className="mb-2 text-xs font-medium text-zinc-500">
                      Cost
                    </p>

                    <div className="flex h-[46px] items-center rounded-lg border bg-white px-3 text-sm font-semibold text-zinc-900">
                      ₱{rowCost.toFixed(2)}
                    </div>
                  </div>

                  {/* REMOVE */}
                  <button
                    type="button"
                    onClick={() =>
                      removeMaterialRow(row.rowId)
                    }
                    disabled={
                      materialRows.length === 1
                    }
                    className="flex h-[46px] items-center justify-center rounded-lg border bg-white text-zinc-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                    title="Remove material"
                  >
                    ×
                  </button>
                </div>

                {selectedMaterial && (
                  <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-zinc-400">
                    <span>
                      Unit cost: ₱
                      {Number(
                        selectedMaterial.cost_per_unit ??
                          0
                      ).toFixed(2)}
                    </span>

                    {selectedMaterial.material_type && (
                      <span>
                        Type:{" "}
                        {selectedMaterial.material_type}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* LABOR */}
      <section className="rounded-2xl border bg-white p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-400">
          Labor
        </p>

        <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-900">
          Production Labor
        </h2>

        <div className="mt-6 max-w-sm">
          <label className="mb-2 block text-xs font-medium text-zinc-500">
            Actual Labor Cost
          </label>

          <div className="flex">
            <div className="flex items-center rounded-l-lg border border-r-0 bg-zinc-100 px-4 text-sm text-zinc-500">
              ₱
            </div>

            <input
              type="number"
              min="0"
              step="0.01"
              value={
                laborCost === 0 ? "" : laborCost
              }
              onChange={(e) =>
                setLaborCost(
                  Number(e.target.value)
                )
              }
              placeholder="0.00"
              className="min-w-0 flex-1 rounded-r-lg border bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-400"
            />
          </div>
        </div>
      </section>

      {/* COST SUMMARY */}
      <section className="rounded-2xl border border-zinc-700 bg-zinc-900 p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
          Cost Summary
        </p>

        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <p className="text-xs text-zinc-500">
              Materials
            </p>

            <p className="mt-2 text-xl font-semibold text-white">
              ₱{materialCost.toFixed(2)}
            </p>
          </div>

          <div>
            <p className="text-xs text-zinc-500">
              Labor
            </p>

            <p className="mt-2 text-xl font-semibold text-white">
              ₱{Number(laborCost || 0).toFixed(2)}
            </p>
          </div>

          <div>
            <p className="text-xs text-zinc-500">
              Production Cost
            </p>

            <p className="mt-2 text-xl font-semibold text-white">
              ₱{totalProductionCost.toFixed(2)}
            </p>
          </div>

          <div>
            <p className="text-xs text-zinc-500">
              Gross Profit
            </p>

            <p className="mt-2 text-xl font-semibold text-white">
              ₱{profit.toFixed(2)}
            </p>
          </div>

          <div>
            <p className="text-xs text-zinc-500">
              Margin
            </p>

            <p className="mt-2 text-xl font-semibold text-white">
              {profitMargin.toFixed(1)}%
            </p>
          </div>
        </div>
      </section>

      {/* MESSAGE */}
      {message && (
        <div className="rounded-xl border border-zinc-700 bg-zinc-900 px-5 py-4 text-sm text-zinc-300">
          {message}
        </div>
      )}

      {/* ACTIONS */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          disabled={isSaving}
          onClick={() =>
            saveLiquidation("draft")
          }
          className="rounded-lg border border-zinc-600 px-5 py-3 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save Draft"}
        </button>

        <button
          type="button"
          disabled={isSaving}
          onClick={() => {
            const confirmed = window.confirm(
              `Finalize liquidation for ${order.order_number}?\n\nThis will freeze the production costs for this bag.`
            );

            if (confirmed) {
              saveLiquidation("finalized");
            }
          }}
          className="rounded-lg bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving
            ? "Saving..."
            : "Finalize Liquidation"}
        </button>
      </div>
    </div>
  );
}