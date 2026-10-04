"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/src/lib/supabase";
import {
  products,
  type ProductName,
} from "@/src/lib/products";

type Tab =
  | "bag-cost"
  | "fabric-calculator"
  | "history";

type CostRecord = {
  id: string;
  product: ProductName;
  material_cost: number;
  labor_cost: number;
  other_cost: number;
  total_cost: number;
  notes: string | null;
  recorded_at: string;
};

type Material = {
  id: string;
  name: string;
  unit: string;
  cost_per_unit: number;
};

type FabricCut = {
  id: number;
  lengthCm: number;
  widthCm: number;
  quantity: number;
};

function peso(value: number) {
  return `₱${Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function isSquareMeterUnit(unit: string) {
  const normalized = unit
    .trim()
    .toLowerCase()
    .replace(/\s/g, "");

  return (
    normalized === "m²" ||
    normalized === "m2" ||
    normalized === "sqm"
  );
}

export default function ProductCostsPage() {
  const productNames =
    Object.keys(products) as ProductName[];

  /*
   * ============================================================
   * TABS
   * ============================================================
   */

  const [activeTab, setActiveTab] =
    useState<Tab>("bag-cost");

  /*
   * ============================================================
   * BAG COST CALCULATOR
   * ============================================================
   */

  const [product, setProduct] =
    useState<ProductName>("Pouch");

  const [materialCost, setMaterialCost] =
    useState(0);

  const [laborCost, setLaborCost] =
    useState(0);

  const [otherCost, setOtherCost] =
    useState(0);

  const [notes, setNotes] =
    useState("");

  const [isSaving, setIsSaving] =
    useState(false);

  const selectedProduct =
    products[product];

  const totalCost =
    Number(materialCost || 0) +
    Number(laborCost || 0) +
    Number(otherCost || 0);

  const sellingPrice =
    selectedProduct.basePrice;

  const grossProfit =
    sellingPrice - totalCost;

  const grossMargin =
    sellingPrice > 0
      ? (grossProfit / sellingPrice) * 100
      : 0;

  /*
   * ============================================================
   * COST HISTORY
   * ============================================================
   */

  const [records, setRecords] =
    useState<CostRecord[]>([]);

  const [filterProduct, setFilterProduct] =
    useState<"all" | ProductName>("all");

  const [sortOrder, setSortOrder] =
    useState<
      "newest" | "oldest" | "highest" | "lowest"
    >("newest");

  const [isLoadingRecords, setIsLoadingRecords] =
    useState(true);

  /*
   * ============================================================
   * FABRIC CALCULATOR
   * ============================================================
   */

  const [materials, setMaterials] =
    useState<Material[]>([]);

  const [isLoadingMaterials, setIsLoadingMaterials] =
    useState(true);

  const [
    selectedFabricMaterialId,
    setSelectedFabricMaterialId,
  ] = useState("");

  const [fabricCuts, setFabricCuts] =
    useState<FabricCut[]>([
      {
        id: 1,
        lengthCm: 0,
        widthCm: 0,
        quantity: 1,
      },
    ]);

  /*
   * ============================================================
   * LOAD DATA
   * ============================================================
   */

  useEffect(() => {
    fetchRecords();
    fetchMaterials();
  }, []);

  async function fetchRecords() {
    setIsLoadingRecords(true);

    const { data, error } = await supabase
      .from("product_cost_records")
      .select("*")
      .order("recorded_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Failed to fetch product cost records:",
        error.message
      );

      setIsLoadingRecords(false);
      return;
    }

    const normalized: CostRecord[] =
      (data ?? []).map((row) => ({
        id: row.id,
        product: row.product as ProductName,
        material_cost:
          Number(row.material_cost) || 0,
        labor_cost:
          Number(row.labor_cost) || 0,
        other_cost:
          Number(row.other_cost) || 0,
        total_cost:
          Number(row.total_cost) || 0,
        notes: row.notes ?? null,
        recorded_at: row.recorded_at,
      }));

    setRecords(normalized);
    setIsLoadingRecords(false);
  }

  async function fetchMaterials() {
    setIsLoadingMaterials(true);

    const { data, error } = await supabase
      .from("materials")
      .select(
        "id, name, unit, cost_per_unit"
      )
      .order("name");

    if (error) {
      console.error(
        "Failed to fetch materials:",
        error.message
      );

      setIsLoadingMaterials(false);
      return;
    }

    const normalized: Material[] =
      (data ?? []).map((row) => ({
        id: row.id,
        name: row.name,
        unit: row.unit ?? "",
        cost_per_unit:
          Number(row.cost_per_unit) || 0,
      }));

    setMaterials(normalized);

    const firstFabric =
      normalized.find((material) =>
        isSquareMeterUnit(material.unit)
      );

    if (
      firstFabric &&
      !selectedFabricMaterialId
    ) {
      setSelectedFabricMaterialId(
        firstFabric.id
      );
    }

    setIsLoadingMaterials(false);
  }

  /*
   * ============================================================
   * SAVE BAG COST
   * ============================================================
   */

  async function saveCost() {
    if (totalCost <= 0) {
      alert(
        "Please enter a material, labor, or other cost first."
      );
      return;
    }

    setIsSaving(true);

    const { error } = await supabase
      .from("product_cost_records")
      .insert([
        {
          product,
          material_cost: materialCost,
          labor_cost: laborCost,
          other_cost: otherCost,
          total_cost: totalCost,
          notes:
            notes.trim() || null,
        },
      ]);

    if (error) {
      console.error(
        "Failed to save cost:",
        error.message
      );

      alert(
        `Could not save cost: ${error.message}`
      );

      setIsSaving(false);
      return;
    }

    setNotes("");

    await fetchRecords();

    setIsSaving(false);

    setActiveTab("history");
  }

  /*
   * ============================================================
   * DELETE COST RECORD
   * ============================================================
   */

  async function deleteRecord(id: string) {
    const confirmed =
      window.confirm(
        "Delete this cost record?"
      );

    if (!confirmed) return;

    const { error } = await supabase
      .from("product_cost_records")
      .delete()
      .eq("id", id);

    if (error) {
      alert(
        `Could not delete record: ${error.message}`
      );
      return;
    }

    setRecords((current) =>
      current.filter(
        (record) => record.id !== id
      )
    );
  }

  /*
   * ============================================================
   * FABRIC CUT CALCULATOR
   * ============================================================
   */

  function addFabricCut() {
    setFabricCuts((current) => [
      ...current,
      {
        id:
          Date.now() +
          Math.floor(Math.random() * 1000),
        lengthCm: 0,
        widthCm: 0,
        quantity: 1,
      },
    ]);
  }

  function removeFabricCut(id: number) {
    setFabricCuts((current) =>
      current.filter(
        (cut) => cut.id !== id
      )
    );
  }

  function updateFabricCut(
    id: number,
    field: keyof Omit<FabricCut, "id">,
    value: number
  ) {
    setFabricCuts((current) =>
      current.map((cut) =>
        cut.id === id
          ? {
              ...cut,
              [field]: value,
            }
          : cut
      )
    );
  }

  function resetFabricCuts() {
    setFabricCuts([
      {
        id: Date.now(),
        lengthCm: 0,
        widthCm: 0,
        quantity: 1,
      },
    ]);
  }

  function calculateFabricCutAreaCm2(
    cut: FabricCut
  ) {
    return (
      cut.lengthCm *
      cut.widthCm *
      cut.quantity
    );
  }

  function calculateFabricCutAreaM2(
    cut: FabricCut
  ) {
    return (
      calculateFabricCutAreaCm2(cut) /
      10000
    );
  }

  const totalFabricAreaCm2 =
    fabricCuts.reduce(
      (total, cut) =>
        total +
        calculateFabricCutAreaCm2(cut),
      0
    );

  const totalFabricAreaM2 =
    totalFabricAreaCm2 / 10000;

  const fabricMaterials =
    materials.filter((material) =>
      isSquareMeterUnit(material.unit)
    );

  const selectedFabricMaterial =
    fabricMaterials.find(
      (material) =>
        material.id ===
        selectedFabricMaterialId
    );

  const fabricCostPerM2 =
    selectedFabricMaterial
      ? Number(
          selectedFabricMaterial.cost_per_unit
        ) || 0
      : 0;

  const fabricCostPerCm2 =
    fabricCostPerM2 / 10000;

  const calculatedFabricCost =
    totalFabricAreaCm2 *
    fabricCostPerCm2;

  function useFabricCostInBag() {
    if (calculatedFabricCost <= 0) {
      alert(
        "Calculate a valid fabric cost first."
      );
      return;
    }

    setMaterialCost(
      Number(
        calculatedFabricCost.toFixed(2)
      )
    );

    setActiveTab("bag-cost");
  }

  /*
   * ============================================================
   * HISTORY FILTER / SORT
   * ============================================================
   */

  const filteredRecords =
    useMemo(() => {
      let result = [...records];

      if (filterProduct !== "all") {
        result = result.filter(
          (record) =>
            record.product ===
            filterProduct
        );
      }

      result.sort((a, b) => {
        if (sortOrder === "newest") {
          return (
            new Date(
              b.recorded_at
            ).getTime() -
            new Date(
              a.recorded_at
            ).getTime()
          );
        }

        if (sortOrder === "oldest") {
          return (
            new Date(
              a.recorded_at
            ).getTime() -
            new Date(
              b.recorded_at
            ).getTime()
          );
        }

        if (sortOrder === "highest") {
          return (
            b.total_cost -
            a.total_cost
          );
        }

        return (
          a.total_cost -
          b.total_cost
        );
      });

      return result;
    }, [
      records,
      filterProduct,
      sortOrder,
    ]);

  function getPreviousRecord(
    current: CostRecord
  ) {
    const sameProduct =
      records
        .filter(
          (record) =>
            record.product ===
              current.product &&
            new Date(
              record.recorded_at
            ).getTime() <
              new Date(
                current.recorded_at
              ).getTime()
        )
        .sort(
          (a, b) =>
            new Date(
              b.recorded_at
            ).getTime() -
            new Date(
              a.recorded_at
            ).getTime()
        );

    return sameProduct[0] ?? null;
  }

  /*
   * ============================================================
   * PAGE
   * ============================================================
   */

  return (
    <main className="min-h-screen bg-[#FAFAF9]">
      <section className="mx-auto max-w-6xl px-6 py-10">
        {/* HEADER */}

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            Product Costs
          </h1>

          <p className="mt-2 text-zinc-600">
            Calculate bag costs, estimate fabric
            usage, and track cost changes over time.
          </p>
        </div>

        {/* TABS */}

        <div className="mb-8 flex flex-wrap gap-2 border-b border-zinc-200">
          <button
            type="button"
            onClick={() =>
              setActiveTab("bag-cost")
            }
            className={`border-b-2 px-4 py-3 text-sm font-medium transition ${
              activeTab === "bag-cost"
                ? "border-zinc-900 text-zinc-900"
                : "border-transparent text-zinc-500 hover:text-zinc-900"
            }`}
          >
            Bag Cost
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveTab(
                "fabric-calculator"
              )
            }
            className={`border-b-2 px-4 py-3 text-sm font-medium transition ${
              activeTab ===
              "fabric-calculator"
                ? "border-zinc-900 text-zinc-900"
                : "border-transparent text-zinc-500 hover:text-zinc-900"
            }`}
          >
            Fabric Calculator
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveTab("history")
            }
            className={`border-b-2 px-4 py-3 text-sm font-medium transition ${
              activeTab === "history"
                ? "border-zinc-900 text-zinc-900"
                : "border-transparent text-zinc-500 hover:text-zinc-900"
            }`}
          >
            Cost History
          </button>
        </div>

        {/* ==================================================
            BAG COST TAB
        ================================================== */}

        {activeTab === "bag-cost" && (
          <div className="grid gap-8 lg:grid-cols-2">
            {/* INPUT */}

            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-zinc-900">
                Bag Cost Calculator
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Enter your current estimated direct
                production costs.
              </p>

              {/* PRODUCT */}

              <div className="mt-6">
                <label className="text-sm font-medium text-zinc-700">
                  Product
                </label>

                <select
                  value={product}
                  onChange={(e) =>
                    setProduct(
                      e.target
                        .value as ProductName
                    )
                  }
                  className="mt-2 w-full rounded-lg border border-zinc-200 px-4 py-3 text-zinc-900"
                >
                  {productNames.map(
                    (productName) => (
                      <option
                        key={productName}
                        value={productName}
                      >
                        {productName}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* MATERIAL */}

              <div className="mt-6">
                <div className="flex items-center justify-between gap-4">
                  <label className="text-sm font-medium text-zinc-700">
                    Material Cost
                  </label>

                  <button
                    type="button"
                    onClick={() =>
                      setActiveTab(
                        "fabric-calculator"
                      )
                    }
                    className="text-xs font-medium text-zinc-500 underline hover:text-zinc-900"
                  >
                    Calculate fabric
                  </button>
                </div>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    materialCost || ""
                  }
                  onChange={(e) =>
                    setMaterialCost(
                      Number(
                        e.target.value
                      )
                    )
                  }
                  className="mt-2 w-full rounded-lg border border-zinc-200 px-4 py-3 text-zinc-900"
                  placeholder="0.00"
                />
              </div>

              {/* LABOR */}

              <div className="mt-6">
                <label className="text-sm font-medium text-zinc-700">
                  Labor Cost
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    laborCost || ""
                  }
                  onChange={(e) =>
                    setLaborCost(
                      Number(
                        e.target.value
                      )
                    )
                  }
                  className="mt-2 w-full rounded-lg border border-zinc-200 px-4 py-3 text-zinc-900"
                  placeholder="0.00"
                />
              </div>

              {/* OTHER */}

              <div className="mt-6">
                <label className="text-sm font-medium text-zinc-700">
                  Other Direct Cost
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    otherCost || ""
                  }
                  onChange={(e) =>
                    setOtherCost(
                      Number(
                        e.target.value
                      )
                    )
                  }
                  className="mt-2 w-full rounded-lg border border-zinc-200 px-4 py-3 text-zinc-900"
                  placeholder="0.00"
                />
              </div>

              {/* NOTES */}

              <div className="mt-6">
                <label className="text-sm font-medium text-zinc-700">
                  Notes
                </label>

                <textarea
                  value={notes}
                  onChange={(e) =>
                    setNotes(
                      e.target.value
                    )
                  }
                  rows={3}
                  placeholder="Optional notes about this cost calculation."
                  className="mt-2 w-full rounded-lg border border-zinc-200 px-4 py-3 text-zinc-900"
                />
              </div>

              <button
                type="button"
                onClick={saveCost}
                disabled={isSaving}
                className="mt-6 w-full rounded-lg bg-zinc-900 px-5 py-3 font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50"
              >
                {isSaving
                  ? "Saving..."
                  : "Save Cost"}
              </button>
            </div>

            {/* SUMMARY */}

            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-zinc-900">
                Cost Summary
              </h2>

              <div className="mt-6 space-y-4">
                <div className="flex justify-between border-b border-zinc-100 pb-3">
                  <span className="text-sm text-zinc-500">
                    Material Cost
                  </span>

                  <span className="font-mono text-zinc-900">
                    {peso(
                      materialCost
                    )}
                  </span>
                </div>

                <div className="flex justify-between border-b border-zinc-100 pb-3">
                  <span className="text-sm text-zinc-500">
                    Labor Cost
                  </span>

                  <span className="font-mono text-zinc-900">
                    {peso(laborCost)}
                  </span>
                </div>

                <div className="flex justify-between border-b border-zinc-100 pb-3">
                  <span className="text-sm text-zinc-500">
                    Other Direct Cost
                  </span>

                  <span className="font-mono text-zinc-900">
                    {peso(otherCost)}
                  </span>
                </div>

                <div className="flex justify-between pt-2">
                  <span className="font-medium text-zinc-900">
                    Estimated Bag Cost
                  </span>

                  <span className="font-mono text-2xl font-bold text-zinc-900">
                    {peso(totalCost)}
                  </span>
                </div>
              </div>

              <div className="mt-8 rounded-lg bg-zinc-50 p-5">
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-500">
                    Selling Price
                  </span>

                  <span className="font-mono font-medium text-zinc-900">
                    {peso(
                      sellingPrice
                    )}
                  </span>
                </div>

                <div className="mt-4 flex justify-between">
                  <span className="text-sm text-zinc-500">
                    Est. Gross Profit
                  </span>

                  <span
                    className={`font-mono font-medium ${
                      grossProfit >= 0
                        ? "text-green-700"
                        : "text-red-600"
                    }`}
                  >
                    {peso(
                      grossProfit
                    )}
                  </span>
                </div>

                <div className="mt-4 flex justify-between">
                  <span className="text-sm text-zinc-500">
                    Est. Gross Margin
                  </span>

                  <span className="font-mono font-medium text-zinc-900">
                    {grossMargin.toFixed(
                      1
                    )}
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================
            FABRIC CALCULATOR TAB
        ================================================== */}

        {activeTab ===
          "fabric-calculator" && (
          <div className="grid gap-8 lg:grid-cols-3">
            {/* CALCULATOR */}

            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm lg:col-span-2">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">
                  Fabric Calculator
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Calculate fabric consumption using
                  pattern-piece dimensions in
                  centimeters.
                </p>
              </div>

              {/* MATERIAL */}

              <div className="mt-6">
                <label className="text-sm font-medium text-zinc-700">
                  Fabric Material
                </label>

                {isLoadingMaterials ? (
                  <p className="mt-2 text-sm text-zinc-500">
                    Loading materials...
                  </p>
                ) : fabricMaterials.length ===
                  0 ? (
                  <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    No materials using m² were found.
                    Set your fabric material unit to
                    m² in the Materials page.
                  </div>
                ) : (
                  <select
                    value={
                      selectedFabricMaterialId
                    }
                    onChange={(e) => {
                      setSelectedFabricMaterialId(
                        e.target.value
                      );
                    }}
                    className="mt-2 w-full rounded-lg border border-zinc-200 px-4 py-3 text-zinc-900"
                  >
                    {fabricMaterials.map(
                      (material) => (
                        <option
                          key={
                            material.id
                          }
                          value={
                            material.id
                          }
                        >
                          {
                            material.name
                          }{" "}
                          —{" "}
                          {peso(
                            material.cost_per_unit
                          )}
                          /m²
                        </option>
                      )
                    )}
                  </select>
                )}
              </div>

              {/* CUTS */}

              <div className="mt-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-medium text-zinc-900">
                      Pattern Pieces
                    </h3>

                    <p className="mt-1 text-xs text-zinc-500">
                      Length × width × quantity.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={
                      resetFabricCuts
                    }
                    className="text-sm text-zinc-500 hover:text-zinc-900"
                  >
                    Reset
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {fabricCuts.map(
                    (cut, index) => (
                      <div
                        key={cut.id}
                        className="rounded-lg border border-zinc-200 bg-zinc-50 p-4"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                            Cut{" "}
                            {index + 1}
                          </p>

                          {fabricCuts.length >
                            1 && (
                            <button
                              type="button"
                              onClick={() =>
                                removeFabricCut(
                                  cut.id
                                )
                              }
                              className="text-sm text-red-600 hover:text-red-700"
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-4">
                          {/* LENGTH */}

                          <div>
                            <label className="text-xs font-medium text-zinc-600">
                              Length
                              (cm)
                            </label>

                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              value={
                                cut.lengthCm ||
                                ""
                              }
                              onChange={(
                                e
                              ) =>
                                updateFabricCut(
                                  cut.id,
                                  "lengthCm",
                                  Number(
                                    e
                                      .target
                                      .value
                                  ) ||
                                    0
                                )
                              }
                              placeholder="24"
                              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-zinc-900"
                            />
                          </div>

                          {/* WIDTH */}

                          <div>
                            <label className="text-xs font-medium text-zinc-600">
                              Width
                              (cm)
                            </label>

                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              value={
                                cut.widthCm ||
                                ""
                              }
                              onChange={(
                                e
                              ) =>
                                updateFabricCut(
                                  cut.id,
                                  "widthCm",
                                  Number(
                                    e
                                      .target
                                      .value
                                  ) ||
                                    0
                                )
                              }
                              placeholder="18"
                              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-zinc-900"
                            />
                          </div>

                          {/* QUANTITY */}

                          <div>
                            <label className="text-xs font-medium text-zinc-600">
                              Quantity
                            </label>

                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={
                                cut.quantity
                              }
                              onChange={(
                                e
                              ) =>
                                updateFabricCut(
                                  cut.id,
                                  "quantity",
                                  Math.max(
                                    1,
                                    parseInt(
                                      e
                                        .target
                                        .value
                                    ) ||
                                      1
                                  )
                                )
                              }
                              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-zinc-900"
                            />
                          </div>

                          {/* AREA */}

                          <div>
                            <label className="text-xs font-medium text-zinc-600">
                              Area
                            </label>

                            <div className="mt-1 rounded-lg border border-zinc-200 bg-white px-3 py-2.5">
                              <p className="font-mono text-sm text-zinc-900">
                                {calculateFabricCutAreaCm2(
                                  cut
                                ).toLocaleString(
                                  "en-PH"
                                )}{" "}
                                cm²
                              </p>

                              <p className="mt-0.5 font-mono text-xs text-zinc-400">
                                {calculateFabricCutAreaM2(
                                  cut
                                ).toFixed(
                                  4
                                )}{" "}
                                m²
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>

                <button
                  type="button"
                  onClick={
                    addFabricCut
                  }
                  className="mt-4 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                >
                  + Add Cut
                </button>
              </div>
            </div>

            {/* FABRIC SUMMARY */}

            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-zinc-900">
                Fabric Cost
              </h2>

              <div className="mt-6 space-y-4">
                <div className="border-b border-zinc-100 pb-4">
                  <p className="text-xs text-zinc-500">
                    Material
                  </p>

                  <p className="mt-1 font-medium text-zinc-900">
                    {selectedFabricMaterial
                      ? selectedFabricMaterial.name
                      : "—"}
                  </p>
                </div>

                <div className="flex justify-between border-b border-zinc-100 pb-4">
                  <span className="text-sm text-zinc-500">
                    Price / m²
                  </span>

                  <span className="font-mono text-zinc-900">
                    {peso(
                      fabricCostPerM2
                    )}
                  </span>
                </div>

                <div className="flex justify-between border-b border-zinc-100 pb-4">
                  <span className="text-sm text-zinc-500">
                    Price / cm²
                  </span>

                  <span className="font-mono text-zinc-900">
                    ₱
                    {fabricCostPerCm2.toFixed(
                      4
                    )}
                  </span>
                </div>

                <div className="flex justify-between border-b border-zinc-100 pb-4">
                  <span className="text-sm text-zinc-500">
                    Total Area
                  </span>

                  <div className="text-right">
                    <p className="font-mono text-zinc-900">
                      {totalFabricAreaCm2.toLocaleString(
                        "en-PH"
                      )}{" "}
                      cm²
                    </p>

                    <p className="mt-0.5 font-mono text-xs text-zinc-400">
                      {totalFabricAreaM2.toFixed(
                        4
                      )}{" "}
                      m²
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-sm text-zinc-500">
                    Estimated Fabric Cost
                  </p>

                  <p className="mt-2 font-mono text-3xl font-bold text-zinc-900">
                    {peso(
                      calculatedFabricCost
                    )}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={
                  useFabricCostInBag
                }
                disabled={
                  calculatedFabricCost <=
                  0
                }
                className="mt-6 w-full rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Use as Material Cost
              </button>

              <p className="mt-3 text-xs leading-5 text-zinc-400">
                This sends the calculated
                fabric total to the Material
                Cost field in the Bag Cost
                tab.
              </p>
            </div>
          </div>
        )}

        {/* ==================================================
            COST HISTORY TAB
        ================================================== */}

        {activeTab === "history" && (
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">
                  Cost History
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Saved bag cost calculations
                  over time.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {/* FILTER */}

                <select
                  value={
                    filterProduct
                  }
                  onChange={(e) =>
                    setFilterProduct(
                      e.target
                        .value as
                        | "all"
                        | ProductName
                    )
                  }
                  className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900"
                >
                  <option value="all">
                    All Products
                  </option>

                  {productNames.map(
                    (productName) => (
                      <option
                        key={
                          productName
                        }
                        value={
                          productName
                        }
                      >
                        {
                          productName
                        }
                      </option>
                    )
                  )}
                </select>

                {/* SORT */}

                <select
                  value={sortOrder}
                  onChange={(e) =>
                    setSortOrder(
                      e.target
                        .value as
                        | "newest"
                        | "oldest"
                        | "highest"
                        | "lowest"
                    )
                  }
                  className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900"
                >
                  <option value="newest">
                    Newest
                  </option>

                  <option value="oldest">
                    Oldest
                  </option>

                  <option value="highest">
                    Highest Cost
                  </option>

                  <option value="lowest">
                    Lowest Cost
                  </option>
                </select>
              </div>
            </div>

            {isLoadingRecords ? (
              <p className="mt-6 text-sm text-zinc-500">
                Loading cost history...
              </p>
            ) : filteredRecords.length ===
              0 ? (
              <p className="mt-6 text-sm text-zinc-500">
                No cost records yet.
              </p>
            ) : (
              <div className="mt-6 space-y-3">
                {filteredRecords.map(
                  (record) => {
                    const previous =
                      getPreviousRecord(
                        record
                      );

                    const change =
                      previous
                        ? record.total_cost -
                          previous.total_cost
                        : null;

                    const percentChange =
                      previous &&
                      previous.total_cost >
                        0
                        ? ((change ??
                            0) /
                            previous.total_cost) *
                          100
                        : null;

                    return (
                      <div
                        key={
                          record.id
                        }
                        className="rounded-lg border border-zinc-100 p-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="font-medium text-zinc-900">
                                {
                                  record.product
                                }
                              </span>

                              <span className="text-xs text-zinc-400">
                                {new Date(
                                  record.recorded_at
                                ).toLocaleDateString(
                                  "en-PH",
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  }
                                )}
                              </span>
                            </div>

                            <p className="mt-2 font-mono text-2xl font-bold text-zinc-900">
                              {peso(
                                record.total_cost
                              )}
                            </p>

                            {change !==
                              null && (
                              <p
                                className={`mt-1 text-xs font-medium ${
                                  change >
                                  0
                                    ? "text-red-600"
                                    : change <
                                      0
                                    ? "text-green-600"
                                    : "text-zinc-500"
                                }`}
                              >
                                {change >
                                0
                                  ? "+"
                                  : ""}
                                {peso(
                                  change
                                )}

                                {percentChange !==
                                  null &&
                                  ` (${percentChange > 0 ? "+" : ""}${percentChange.toFixed(
                                    1
                                  )}%)`}
                              </p>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              deleteRecord(
                                record.id
                              )
                            }
                            className="text-sm text-red-600 hover:text-red-700"
                          >
                            Delete
                          </button>
                        </div>

                        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                          <div>
                            <p className="text-xs text-zinc-400">
                              Materials
                            </p>

                            <p className="mt-1 font-mono text-zinc-700">
                              {peso(
                                record.material_cost
                              )}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-zinc-400">
                              Labor
                            </p>

                            <p className="mt-1 font-mono text-zinc-700">
                              {peso(
                                record.labor_cost
                              )}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-zinc-400">
                              Other
                            </p>

                            <p className="mt-1 font-mono text-zinc-700">
                              {peso(
                                record.other_cost
                              )}
                            </p>
                          </div>
                        </div>

                        {record.notes && (
                          <p className="mt-4 text-sm text-zinc-500">
                            {
                              record.notes
                            }
                          </p>
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}