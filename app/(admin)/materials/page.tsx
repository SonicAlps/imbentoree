"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/src/lib/supabase";

type Material = {
  id: string;
  name: string;
  material_type: string | null;
  allowed_uses: string[];
  unit: string;
  cost_per_unit: number;
  supplier: string | null;
  purchase_length_m: number | null;
  purchase_width_m: number | null;
  purchase_price: number | null;
  purchase_quantity: number | null;
  purchase_unit_amount: number | null;
  created_at: string;
};

type CostingMethod = "area" | "linear" | "piece" | "other";
type LengthUnit = "mm" | "cm" | "inch" | "meter" | "yard";

const ALLOWED_USE_OPTIONS = [
  { value: "outer_fabric", label: "Outer Fabric" },
  { value: "inner_fabric", label: "Inner Fabric" },
  { value: "strap", label: "Strap" },
  { value: "strap_mounting", label: "Strap Mounting" },
];

const LENGTH_UNIT_OPTIONS: { value: LengthUnit; label: string }[] = [
  { value: "mm", label: "Millimeter (mm)" },
  { value: "cm", label: "Centimeter (cm)" },
  { value: "inch", label: "Inch (in)" },
  { value: "meter", label: "Meter (m)" },
  { value: "yard", label: "Yard (yd)" },
];

const OTHER_UNIT_OPTIONS = [
  { value: "spool", label: "Spool" },
  { value: "kg", label: "Kilogram (kg)" },
];

function toMeters(value: number, unit: LengthUnit) {
  switch (unit) {
    case "mm":
      return value / 1000;
    case "cm":
      return value / 100;
    case "inch":
      return value * 0.0254;
    case "yard":
      return value * 0.9144;
    case "meter":
    default:
      return value;
  }
}

function peso(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(value);
}

function methodFromStoredUnit(unit: string): CostingMethod {
  if (unit === "m²") return "area";
  if (unit === "meter") return "linear";
  if (unit === "piece") return "piece";
  return "other";
}

function standardUnitLabel(
  method: CostingMethod,
  otherUnit: string
) {
  if (method === "area") return "m²";
  if (method === "linear") return "meter";
  if (method === "piece") return "piece";
  return otherUnit || "unit";
}

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(
    null
  );

  const [name, setName] = useState("");
  const [materialType, setMaterialType] = useState("");
  const [allowedUses, setAllowedUses] = useState<string[]>(
    []
  );
  const [supplier, setSupplier] = useState("");

  // The user chooses the kind of material.
  // Imbentoree chooses the standard costing unit automatically.
  const [costingMethod, setCostingMethod] =
    useState<CostingMethod>("area");
  const [otherUnit, setOtherUnit] = useState("spool");

  // AREA purchase entry
  const [purchaseLength, setPurchaseLength] = useState(0);
  const [purchaseLengthUnit, setPurchaseLengthUnit] =
    useState<LengthUnit>("yard");
  const [purchaseWidth, setPurchaseWidth] = useState(0);
  const [purchaseWidthUnit, setPurchaseWidthUnit] =
    useState<LengthUnit>("inch");
  const [purchaseAreaQuantity, setPurchaseAreaQuantity] =
    useState(1);

  // LINEAR purchase entry
  const [linearLength, setLinearLength] = useState(0);
  const [linearLengthUnit, setLinearLengthUnit] =
    useState<LengthUnit>("meter");
  const [linearQuantity, setLinearQuantity] = useState(1);

  // PIECE / OTHER purchase entry
  const [purchaseQuantity, setPurchaseQuantity] =
    useState(0);
  const [purchaseUnitAmount, setPurchaseUnitAmount] =
    useState(1);

  // Total amount paid for the purchase.
  const [purchaseAmount, setPurchaseAmount] = useState(0);

  useEffect(() => {
    void fetchMaterials();
  }, []);

  async function fetchMaterials() {
    setLoading(true);

    const { data, error } = await supabase
      .from("materials")
      .select(
        "id, name, material_type, allowed_uses, unit, cost_per_unit, supplier, purchase_length_m, purchase_width_m, purchase_price, purchase_quantity, purchase_unit_amount, created_at"
      )
      .order("name");

    if (error) {
      console.error(
        "Failed to fetch materials:",
        error.message
      );
      alert(`Could not load materials: ${error.message}`);
      setMaterials([]);
    } else {
      setMaterials(
        ((data as Material[]) || []).map((item) => ({
          ...item,
          allowed_uses: item.allowed_uses || [],
        }))
      );
    }

    setLoading(false);
  }

  const areaLengthM = useMemo(
    () => toMeters(purchaseLength, purchaseLengthUnit),
    [purchaseLength, purchaseLengthUnit]
  );

  const areaWidthM = useMemo(
    () => toMeters(purchaseWidth, purchaseWidthUnit),
    [purchaseWidth, purchaseWidthUnit]
  );

  const areaPerPieceM2 =
    areaLengthM > 0 && areaWidthM > 0
      ? areaLengthM * areaWidthM
      : 0;

  const totalAreaM2 =
    areaPerPieceM2 > 0 && purchaseAreaQuantity > 0
      ? areaPerPieceM2 * purchaseAreaQuantity
      : 0;

  const costPerM2 =
    totalAreaM2 > 0 && purchaseAmount > 0
      ? purchaseAmount / totalAreaM2
      : 0;

  const linearLengthM = useMemo(
    () => toMeters(linearLength, linearLengthUnit),
    [linearLength, linearLengthUnit]
  );

  const totalLinearMeters =
    linearLengthM > 0 && linearQuantity > 0
      ? linearLengthM * linearQuantity
      : 0;

  const costPerMeter =
    totalLinearMeters > 0 && purchaseAmount > 0
      ? purchaseAmount / totalLinearMeters
      : 0;

  const totalPieces =
    purchaseQuantity > 0 && purchaseUnitAmount > 0
      ? purchaseQuantity * purchaseUnitAmount
      : 0;

  const genericCostPerUnit =
    totalPieces > 0 && purchaseAmount > 0
      ? purchaseAmount / totalPieces
      : 0;

  const previewCost =
    costingMethod === "area"
      ? costPerM2
      : costingMethod === "linear"
      ? costPerMeter
      : genericCostPerUnit;

  const standardUnit = standardUnitLabel(
    costingMethod,
    otherUnit
  );

  function resetForm() {
    setEditingId(null);
    setName("");
    setMaterialType("");
    setAllowedUses([]);
    setSupplier("");

    setCostingMethod("area");
    setOtherUnit("spool");

    setPurchaseLength(0);
    setPurchaseLengthUnit("yard");
    setPurchaseWidth(0);
    setPurchaseWidthUnit("inch");
    setPurchaseAreaQuantity(1);

    setLinearLength(0);
    setLinearLengthUnit("meter");
    setLinearQuantity(1);

    setPurchaseQuantity(0);
    setPurchaseUnitAmount(1);
    setPurchaseAmount(0);
  }

  function startEdit(material: Material) {
    setEditingId(material.id);
    setName(material.name);
    setMaterialType(material.material_type ?? "");
    setAllowedUses(material.allowed_uses || []);
    setSupplier(material.supplier ?? "");
    setPurchaseAmount(Number(material.purchase_price) || 0);

    const storedMethod = methodFromStoredUnit(
      material.unit
    );

    setCostingMethod(storedMethod);

    if (storedMethod === "area") {
      // Existing DB values are already meters.
      setPurchaseLength(
        Number(material.purchase_length_m) || 0
      );
      setPurchaseLengthUnit("meter");
      setPurchaseWidth(
        Number(material.purchase_width_m) || 0
      );
      setPurchaseWidthUnit("meter");
      setPurchaseAreaQuantity(
        Number(material.purchase_quantity) || 1
      );
    } else if (storedMethod === "linear") {
      setLinearLength(
        Number(material.purchase_unit_amount) || 0
      );
      setLinearLengthUnit("meter");
      setLinearQuantity(
        Number(material.purchase_quantity) || 1
      );
    } else {
      if (storedMethod === "other" && material.unit) {
        setOtherUnit(material.unit);
      }

      setPurchaseQuantity(
        Number(material.purchase_quantity) || 0
      );
      setPurchaseUnitAmount(
        Number(material.purchase_unit_amount) || 1
      );
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function toggleAllowedUse(value: string) {
    setAllowedUses((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    );
  }

  async function handleSave() {
    if (!name.trim()) {
      alert("Please enter a material name.");
      return;
    }

    if (!materialType.trim()) {
      alert(
        "Please enter a material type, such as Pellon, Cordura, Webbing, Hook, or D-Ring."
      );
      return;
    }

    if (purchaseAmount <= 0) {
      alert("Enter the total Purchased Amount.");
      return;
    }

    let finalCostPerUnit = 0;
    let storedUnit = "";
    let storedLengthM: number | null = null;
    let storedWidthM: number | null = null;
    let storedPurchaseQuantity: number | null = null;
    let storedPurchaseUnitAmount: number | null = null;

    if (costingMethod === "area") {
      if (
        purchaseLength <= 0 ||
        purchaseWidth <= 0 ||
        purchaseAreaQuantity <= 0
      ) {
        alert(
          "For area materials, enter the purchased length, width, and quantity."
        );
        return;
      }

      finalCostPerUnit = costPerM2;

      // AUTOMATIC STANDARD:
      // all area materials are saved as cost per square meter.
      storedUnit = "m²";

      // We store converted dimensions in meters.
      storedLengthM = areaLengthM;
      storedWidthM = areaWidthM;

      // Number of equal-sized cuts/sheets purchased.
      storedPurchaseQuantity = purchaseAreaQuantity;
      storedPurchaseUnitAmount = 1;
    } else if (costingMethod === "linear") {
      if (linearLength <= 0 || linearQuantity <= 0) {
        alert(
          "For linear materials, enter the purchased length and quantity."
        );
        return;
      }

      finalCostPerUnit = costPerMeter;

      // AUTOMATIC STANDARD:
      // all linear materials are saved as cost per meter.
      storedUnit = "meter";

      storedPurchaseQuantity = linearQuantity;
      storedPurchaseUnitAmount = linearLengthM;
    } else if (costingMethod === "piece") {
      if (
        purchaseQuantity <= 0 ||
        purchaseUnitAmount <= 0
      ) {
        alert(
          "For piece materials, enter purchase quantity and pieces in each purchase unit."
        );
        return;
      }

      finalCostPerUnit = genericCostPerUnit;

      // AUTOMATIC STANDARD:
      // piece materials are saved as cost per piece.
      storedUnit = "piece";

      storedPurchaseQuantity = purchaseQuantity;
      storedPurchaseUnitAmount = purchaseUnitAmount;
    } else {
      if (
        purchaseQuantity <= 0 ||
        purchaseUnitAmount <= 0
      ) {
        alert(
          "Enter purchase quantity and amount in each purchase unit."
        );
        return;
      }

      finalCostPerUnit = genericCostPerUnit;
      storedUnit = otherUnit;
      storedPurchaseQuantity = purchaseQuantity;
      storedPurchaseUnitAmount = purchaseUnitAmount;
    }

    if (
      !Number.isFinite(finalCostPerUnit) ||
      finalCostPerUnit <= 0
    ) {
      alert(
        "Could not calculate a valid standard material cost."
      );
      return;
    }

    const payload = {
      name: name.trim(),
      material_type: materialType.trim(),
      allowed_uses: allowedUses,

      // Cost History reads this.
      // It is NEVER "yard" for an area material.
      unit: storedUnit,

      supplier: supplier.trim() || null,

      purchase_length_m: storedLengthM,
      purchase_width_m: storedWidthM,

      purchase_quantity: storedPurchaseQuantity,
      purchase_unit_amount: storedPurchaseUnitAmount,

      // Existing column name retained.
      // Meaning: total amount paid for this purchase.
      purchase_price: purchaseAmount,

      // Standard cost used by Cost History.
      cost_per_unit:
        Math.round(finalCostPerUnit * 10000) / 10000,
    };

    setSaving(true);

    const query = editingId
      ? supabase
          .from("materials")
          .update(payload)
          .eq("id", editingId)
      : supabase.from("materials").insert([payload]);

    const { error } = await query;

    setSaving(false);

    if (error) {
      console.error(
        "Material save failed:",
        error.message
      );
      alert(
        `Could not save material: ${error.message}`
      );
      return;
    }

    resetForm();
    await fetchMaterials();
  }

  async function handleDelete(id: string) {
    const material = materials.find(
      (item) => item.id === id
    );

    const {
      count,
      error: referenceError,
    } = await supabase
      .from("product_recipe_items")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("material_id", id);

    if (referenceError) {
      alert(
        `Could not check material usage: ${referenceError.message}`
      );
      return;
    }

    if ((count ?? 0) > 0) {
      alert(
        `${material?.name ?? "This material"} cannot be deleted because it is currently used in ${count} product ${
          count === 1 ? "recipe" : "recipes"
        }.\n\nRemove it from those product recipes first, then delete it here.`
      );
      return;
    }

    if (
      !confirm(
        `Delete ${material?.name ?? "this material"}?`
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from("materials")
      .delete()
      .eq("id", id);

    if (error) {
      alert(
        `Could not delete material: ${error.message}`
      );
      return;
    }

    await fetchMaterials();
  }

  return (
    <div className="min-h-screen bg-white px-4 py-8 text-zinc-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-10">
        <header className="border-b border-black pb-6">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
            Imbentoree
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Materials
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600">
            Enter how the supplier sells the material.
            Imbentoree converts it into a standard cost
            before Product Cost uses it.
          </p>
        </header>

        <section className="border-b border-zinc-200 pb-10">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm font-medium">
              Material Name
              <input
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="Fabric"
                className="mt-2 w-full border border-zinc-300 bg-white px-4 py-3"
              />
            </label>

            <label className="text-sm font-medium">
              Material Type
              <input
                value={materialType}
                onChange={(event) =>
                  setMaterialType(event.target.value)
                }
                placeholder="Cordura, Oxford, Pellon"
                className="mt-2 w-full border border-zinc-300 bg-white px-4 py-3"
              />
            </label>

            <label className="text-sm font-medium">
              Supplier
              <input
                value={supplier}
                onChange={(event) =>
                  setSupplier(event.target.value)
                }
                placeholder="Optional"
                className="mt-2 w-full border border-zinc-300 bg-white px-4 py-3"
              />
            </label>

            <div className="md:col-span-2 lg:col-span-3">
              <p className="text-sm font-medium">
                Material Costing Type
              </p>

              <p className="mt-1 text-xs text-zinc-500">
                Choose how this material is consumed.
                The standard costing unit is selected
                automatically.
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  {
                    value: "area" as const,
                    label: "Area Material",
                    help: "Fabric, Pellon, foam, felt",
                  },
                  {
                    value: "linear" as const,
                    label: "Linear Material",
                    help: "Webbing, paracord, zipper",
                  },
                  {
                    value: "piece" as const,
                    label: "Piece",
                    help: "Hooks, buckles, D-rings",
                  },
                  {
                    value: "other" as const,
                    label: "Other",
                    help: "Spool, kilogram",
                  },
                ].map((option) => {
                  const active =
                    costingMethod === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setCostingMethod(option.value)
                      }
                      className={`border px-4 py-3 text-left text-sm ${
                        active
                          ? "border-black bg-black text-white"
                          : "border-zinc-300 bg-white text-zinc-700"
                      }`}
                    >
                      <span className="block font-medium">
                        {option.label}
                      </span>
                      <span
                        className={`mt-1 block text-xs ${
                          active
                            ? "text-zinc-300"
                            : "text-zinc-500"
                        }`}
                      >
                        {option.help}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border border-black p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">
                Standard Costing Unit
              </p>
              <p className="mt-1 text-2xl font-semibold">
                {standardUnit}
              </p>
              <p className="mt-2 text-xs leading-5 text-zinc-500">
                {costingMethod === "area" &&
                  "Area materials are always saved as cost per square meter."}
                {costingMethod === "linear" &&
                  "Linear materials are always saved as cost per meter."}
                {costingMethod === "piece" &&
                  "Hardware is always saved as cost per piece."}
                {costingMethod === "other" &&
                  "Choose the standard unit below."}
              </p>
            </div>

            {costingMethod === "other" && (
              <label className="text-sm font-medium">
                Standard Unit
                <select
                  value={otherUnit}
                  onChange={(event) =>
                    setOtherUnit(event.target.value)
                  }
                  className="mt-2 w-full border border-zinc-300 bg-white px-4 py-3"
                >
                  {OTHER_UNIT_OPTIONS.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <div className="md:col-span-2 lg:col-span-3 border-t border-zinc-200 pt-5">
              <p className="text-sm font-semibold">
                Supplier Purchase
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Enter the dimensions exactly as the
                supplier lists them.
              </p>
            </div>

            {costingMethod === "area" && (
              <>
                <div>
                  <p className="text-sm font-medium">
                    Purchased Length
                  </p>
                  <div className="mt-2 grid grid-cols-[1fr_150px]">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={purchaseLength || ""}
                      onChange={(event) =>
                        setPurchaseLength(
                          Number(event.target.value)
                        )
                      }
                      placeholder="1"
                      className="border border-r-0 border-zinc-300 bg-white px-4 py-3"
                    />
                    <select
                      value={purchaseLengthUnit}
                      onChange={(event) =>
                        setPurchaseLengthUnit(
                          event.target
                            .value as LengthUnit
                        )
                      }
                      className="border border-zinc-300 bg-white px-3 py-3"
                    >
                      {LENGTH_UNIT_OPTIONS.map(
                        (option) => (
                          <option
                            key={option.value}
                            value={option.value}
                          >
                            {option.label}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium">
                    Purchased Width
                  </p>
                  <div className="mt-2 grid grid-cols-[1fr_150px]">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={purchaseWidth || ""}
                      onChange={(event) =>
                        setPurchaseWidth(
                          Number(event.target.value)
                        )
                      }
                      placeholder="52"
                      className="border border-r-0 border-zinc-300 bg-white px-4 py-3"
                    />
                    <select
                      value={purchaseWidthUnit}
                      onChange={(event) =>
                        setPurchaseWidthUnit(
                          event.target
                            .value as LengthUnit
                        )
                      }
                      className="border border-zinc-300 bg-white px-3 py-3"
                    >
                      {LENGTH_UNIT_OPTIONS.map(
                        (option) => (
                          <option
                            key={option.value}
                            value={option.value}
                          >
                            {option.label}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>

                <label className="text-sm font-medium">
                  Quantity Purchased
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={purchaseAreaQuantity || ""}
                    onChange={(event) =>
                      setPurchaseAreaQuantity(
                        Number(event.target.value)
                      )
                    }
                    placeholder="1"
                    className="mt-2 w-full border border-zinc-300 bg-white px-4 py-3"
                  />
                  <span className="mt-1 block text-xs font-normal text-zinc-500">
                    Number of equal-sized cuts/sheets.
                  </span>
                </label>
              </>
            )}

            {costingMethod === "linear" && (
              <>
                <div>
                  <p className="text-sm font-medium">
                    Length per Purchased Unit
                  </p>
                  <div className="mt-2 grid grid-cols-[1fr_150px]">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={linearLength || ""}
                      onChange={(event) =>
                        setLinearLength(
                          Number(event.target.value)
                        )
                      }
                      placeholder="50"
                      className="border border-r-0 border-zinc-300 bg-white px-4 py-3"
                    />
                    <select
                      value={linearLengthUnit}
                      onChange={(event) =>
                        setLinearLengthUnit(
                          event.target
                            .value as LengthUnit
                        )
                      }
                      className="border border-zinc-300 bg-white px-3 py-3"
                    >
                      {LENGTH_UNIT_OPTIONS.map(
                        (option) => (
                          <option
                            key={option.value}
                            value={option.value}
                          >
                            {option.label}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>

                <label className="text-sm font-medium">
                  Quantity Purchased
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={linearQuantity || ""}
                    onChange={(event) =>
                      setLinearQuantity(
                        Number(event.target.value)
                      )
                    }
                    className="mt-2 w-full border border-zinc-300 bg-white px-4 py-3"
                  />
                </label>
              </>
            )}

            {(costingMethod === "piece" ||
              costingMethod === "other") && (
              <>
                <label className="text-sm font-medium">
                  Purchase Quantity
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={purchaseQuantity || ""}
                    onChange={(event) =>
                      setPurchaseQuantity(
                        Number(event.target.value)
                      )
                    }
                    className="mt-2 w-full border border-zinc-300 bg-white px-4 py-3"
                  />
                </label>

                <label className="text-sm font-medium">
                  Amount in Each Purchased Unit
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={purchaseUnitAmount || ""}
                    onChange={(event) =>
                      setPurchaseUnitAmount(
                        Number(event.target.value)
                      )
                    }
                    className="mt-2 w-full border border-zinc-300 bg-white px-4 py-3"
                  />
                  <span className="mt-1 block text-xs font-normal text-zinc-500">
                    Example: 10 packs × 20 pieces.
                  </span>
                </label>
              </>
            )}

            <label className="text-sm font-medium">
              Purchased Amount — Total (₱)
              <input
                type="number"
                min="0"
                step="0.01"
                value={purchaseAmount || ""}
                onChange={(event) =>
                  setPurchaseAmount(
                    Number(event.target.value)
                  )
                }
                placeholder="70"
                className="mt-2 w-full border border-zinc-300 bg-white px-4 py-3"
              />
              <span className="mt-1 block text-xs font-normal text-zinc-500">
                Total peso amount you paid for this
                purchase.
              </span>
            </label>

            <div className="border border-zinc-300 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">
                Standard Material Cost
              </p>
              <p className="mt-1 text-xl font-semibold">
                {peso(previewCost)} / {standardUnit}
              </p>

              {costingMethod === "area" && (
                <div className="mt-3 space-y-1 text-xs text-zinc-500">
                  <p>
                    Converted length:{" "}
                    {areaLengthM.toFixed(4)} m
                  </p>
                  <p>
                    Converted width:{" "}
                    {areaWidthM.toFixed(4)} m
                  </p>
                  <p>
                    Total purchased area:{" "}
                    {totalAreaM2.toFixed(4)} m²
                  </p>
                </div>
              )}

              {costingMethod === "linear" && (
                <div className="mt-3 space-y-1 text-xs text-zinc-500">
                  <p>
                    Total purchased length:{" "}
                    {totalLinearMeters.toFixed(4)} m
                  </p>
                </div>
              )}
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              <p className="text-sm font-medium">
                Allowed Uses
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Used to filter guided material choices.
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {ALLOWED_USE_OPTIONS.map((option) => {
                  const active =
                    allowedUses.includes(option.value);

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        toggleAllowedUse(option.value)
                      }
                      className={`border px-3 py-2 text-xs font-medium ${
                        active
                          ? "border-black bg-black text-white"
                          : "border-zinc-300 bg-white text-zinc-600"
                      }`}
                    >
                      {active ? "✓ " : ""}
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="border border-black bg-black px-5 py-3 text-sm font-medium text-white disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : editingId
                ? "Update Material"
                : "Add Material"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="border border-zinc-300 bg-white px-5 py-3 text-sm font-medium"
              >
                Cancel
              </button>
            )}
          </div>
        </section>

        <section>
          <div className="border-b border-black pb-3">
            <h2 className="text-lg font-semibold">
              Material Catalog
            </h2>
          </div>

          {loading ? (
            <p className="py-6 text-sm text-zinc-500">
              Loading materials...
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b border-zinc-300 text-zinc-500">
                  <tr>
                    <th className="px-3 py-3">
                      Material
                    </th>
                    <th className="px-3 py-3">
                      Type
                    </th>
                    <th className="px-3 py-3">
                      Standard Unit
                    </th>
                    <th className="px-3 py-3">
                      Standard Cost
                    </th>
                    <th className="px-3 py-3">
                      Supplier
                    </th>
                    <th className="px-3 py-3">
                      Allowed Uses
                    </th>
                    <th className="px-3 py-3 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-zinc-200">
                  {materials.map((material) => (
                    <tr key={material.id}>
                      <td className="px-3 py-4 font-medium">
                        {material.name}
                      </td>
                      <td className="px-3 py-4 text-zinc-600">
                        {material.material_type || "—"}
                      </td>
                      <td className="px-3 py-4">
                        {material.unit}
                      </td>
                      <td className="px-3 py-4">
                        {peso(
                          Number(material.cost_per_unit)
                        )}{" "}
                        / {material.unit}
                      </td>
                      <td className="px-3 py-4 text-zinc-600">
                        {material.supplier || "—"}
                      </td>
                      <td className="px-3 py-4 text-xs text-zinc-500">
                        {material.allowed_uses.length > 0
                          ? material.allowed_uses
                              .map(
                                (use) =>
                                  ALLOWED_USE_OPTIONS.find(
                                    (option) =>
                                      option.value === use
                                  )?.label || use
                              )
                              .join(", ")
                          : "Additional only"}
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              startEdit(material)
                            }
                            className="border border-zinc-300 px-3 py-1.5 text-sm"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              void handleDelete(
                                material.id
                              )
                            }
                            className="border border-zinc-300 px-3 py-1.5 text-sm text-red-600"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {materials.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-3 py-8 text-center text-zinc-500"
                      >
                        No materials yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}