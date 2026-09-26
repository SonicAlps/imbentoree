"use client";

import { useEffect, useState } from "react";
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

const ALLOWED_USE_OPTIONS = [
  { value: "outer_fabric", label: "Outer Fabric" },
  { value: "inner_fabric", label: "Inner Fabric" },
  { value: "strap", label: "Strap" },
  { value: "strap_mounting", label: "Strap Mounting" },
];

const UNIT_OPTIONS = [
  { value: "m²", label: "Square meter (m²)", shortLabel: "m²" },
  { value: "meter", label: "Meter (m)", shortLabel: "m" },
  { value: "yard", label: "Yard (yd)", shortLabel: "yd" },
  { value: "piece", label: "Piece (pc)", shortLabel: "pc" },
  { value: "spool", label: "Spool", shortLabel: "spool" },
  { value: "kg", label: "Kilogram (kg)", shortLabel: "kg" },
];

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [materialType, setMaterialType] = useState("");
  const [allowedUses, setAllowedUses] = useState<string[]>([]);
  const [unit, setUnit] = useState("meter");
  const [supplier, setSupplier] = useState("");
  const [purchaseLengthM, setPurchaseLengthM] = useState(0);
  const [purchaseWidthM, setPurchaseWidthM] = useState(0);
  const [purchaseQuantity, setPurchaseQuantity] = useState(0);
  const [purchaseUnitAmount, setPurchaseUnitAmount] = useState(0);
  const [purchasePrice, setPurchasePrice] = useState(0);

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
      console.error("Failed to fetch materials:", error.message);
      alert(`Could not load materials: ${error.message}`);
      setMaterials([]);
    } else {
      setMaterials(((data as Material[]) || []).map((item) => ({ ...item, allowed_uses: item.allowed_uses || [] })));
    }
    setLoading(false);
  }

  const purchasedFabricArea =
    purchaseLengthM > 0 && purchaseWidthM > 0
      ? purchaseLengthM * purchaseWidthM
      : 0;

  const calculatedFabricCostPerM2 =
    purchasedFabricArea > 0 && purchasePrice > 0
      ? purchasePrice / purchasedFabricArea
      : 0;

  const totalPurchasedAmount =
    purchaseQuantity > 0 && purchaseUnitAmount > 0
      ? purchaseQuantity * purchaseUnitAmount
      : 0;

  const calculatedCostPerUnit =
    totalPurchasedAmount > 0 && purchasePrice > 0
      ? purchasePrice / totalPurchasedAmount
      : 0;

  const previewCost =
    unit === "m²" ? calculatedFabricCostPerM2 : calculatedCostPerUnit;

  function resetForm() {
    setEditingId(null);
    setName("");
    setMaterialType("");
    setAllowedUses([]);
    setUnit("meter");
    setSupplier("");
    setPurchaseLengthM(0);
    setPurchaseWidthM(0);
    setPurchaseQuantity(0);
    setPurchaseUnitAmount(0);
    setPurchasePrice(0);
  }

  function startEdit(material: Material) {
    setEditingId(material.id);
    setName(material.name);
    setMaterialType(material.material_type ?? "");
    setAllowedUses(material.allowed_uses || []);
    setUnit(material.unit);
    setSupplier(material.supplier ?? "");
    setPurchaseLengthM(Number(material.purchase_length_m) || 0);
    setPurchaseWidthM(Number(material.purchase_width_m) || 0);
    setPurchaseQuantity(Number(material.purchase_quantity) || 0);
    setPurchaseUnitAmount(Number(material.purchase_unit_amount) || 0);
    setPurchasePrice(Number(material.purchase_price) || 0);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      alert("Please enter a material type, such as Honeycomb, Cordura, D-Ring, Hook, Webbing, or Paracord.");
      return;
    }

    let finalCostPerUnit = 0;
    if (unit === "m²") {
      if (purchaseLengthM <= 0 || purchaseWidthM <= 0 || purchasePrice <= 0) {
        alert("For m² materials, enter purchase length, width, and price.");
        return;
      }
      finalCostPerUnit = calculatedFabricCostPerM2;
    } else {
      if (purchaseQuantity <= 0 || purchaseUnitAmount <= 0 || purchasePrice <= 0) {
        alert("Enter purchase quantity, amount per purchased unit, and total price.");
        return;
      }
      finalCostPerUnit = calculatedCostPerUnit;
    }

    const payload = {
      name: name.trim(),
      material_type: materialType.trim(),
      allowed_uses: allowedUses,
      unit,
      supplier: supplier.trim() || null,
      purchase_length_m: unit === "m²" ? purchaseLengthM : null,
      purchase_width_m: unit === "m²" ? purchaseWidthM : null,
      purchase_quantity: unit === "m²" ? null : purchaseQuantity,
      purchase_unit_amount: unit === "m²" ? null : purchaseUnitAmount,
      purchase_price: purchasePrice,
      cost_per_unit: Math.round(finalCostPerUnit * 10000) / 10000,
    };

    setSaving(true);
    const query = editingId
      ? supabase.from("materials").update(payload).eq("id", editingId)
      : supabase.from("materials").insert([payload]);

    const { error } = await query;
    setSaving(false);

    if (error) {
      console.error("Material save failed:", error.message);
      alert(`Could not save material: ${error.message}`);
      return;
    }

    resetForm();
    await fetchMaterials();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this material? Referenced materials may be protected by order history.")) {
      return;
    }

    const { error } = await supabase.from("materials").delete().eq("id", id);
    if (error) {
      alert(`Could not delete material: ${error.message}`);
      return;
    }
    await fetchMaterials();
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-8 text-zinc-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Materials</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Master reference for physical materials, current costs, and where each material should appear in the guided order form.
          </p>
        </div>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm font-medium">
              Material Name
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Black Honeycomb" className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-4 py-3" />
            </label>

            <label className="text-sm font-medium">
              Material Type
              <input value={materialType} onChange={(e) => setMaterialType(e.target.value)} placeholder="Honeycomb, D-Ring, Hook..." className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-4 py-3" />
              <span className="mt-1 block text-xs font-normal text-zinc-500">What the material physically is—not where a product must use it.</span>
            </label>

            <div className="text-sm font-medium md:col-span-2 lg:col-span-3">
              <p>Allowed Uses</p>
              <p className="mt-1 text-xs font-normal text-zinc-500">These only filter the four guided order fields. Additional Materials can still use any material.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {ALLOWED_USE_OPTIONS.map((option) => {
                  const active = allowedUses.includes(option.value);
                  return (
                    <button key={option.value} type="button" onClick={() => toggleAllowedUse(option.value)} className={`rounded-full border px-3 py-2 text-xs font-medium transition ${active ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 bg-white text-zinc-600 hover:border-zinc-500"}`}>
                      {active ? "✓ " : ""}{option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="text-sm font-medium">
              Unit
              <select value={unit} onChange={(e) => setUnit(e.target.value)} className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-4 py-3">
                {UNIT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>

            <label className="text-sm font-medium">
              Supplier
              <input value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Optional" className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-4 py-3" />
            </label>

            {unit === "m²" ? (
              <>
                <label className="text-sm font-medium">Purchased Length (m)<input type="number" min="0" step="0.01" value={purchaseLengthM || ""} onChange={(e) => setPurchaseLengthM(Number(e.target.value))} className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-4 py-3" /></label>
                <label className="text-sm font-medium">Purchased Width (m)<input type="number" min="0" step="0.01" value={purchaseWidthM || ""} onChange={(e) => setPurchaseWidthM(Number(e.target.value))} className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-4 py-3" /></label>
              </>
            ) : (
              <>
                <label className="text-sm font-medium">Purchase Quantity<input type="number" min="0" step="0.01" value={purchaseQuantity || ""} onChange={(e) => setPurchaseQuantity(Number(e.target.value))} className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-4 py-3" /></label>
                <label className="text-sm font-medium">Amount per Purchased Unit<input type="number" min="0" step="0.01" value={purchaseUnitAmount || ""} onChange={(e) => setPurchaseUnitAmount(Number(e.target.value))} className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-4 py-3" /></label>
              </>
            )}

            <label className="text-sm font-medium">
              Purchase Price (₱)
              <input type="number" min="0" step="0.01" value={purchasePrice || ""} onChange={(e) => setPurchasePrice(Number(e.target.value))} className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-4 py-3" />
            </label>

            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Calculated Cost</p>
              <p className="mt-1 text-xl font-semibold">₱{previewCost.toFixed(2)} / {UNIT_OPTIONS.find((item) => item.value === unit)?.shortLabel ?? unit}</p>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button type="button" onClick={handleSave} disabled={saving} className="rounded-lg bg-black px-5 py-3 font-medium text-white disabled:opacity-50">{saving ? "Saving..." : editingId ? "Update Material" : "Add Material"}</button>
            {editingId && <button type="button" onClick={resetForm} className="rounded-lg border border-zinc-300 bg-white px-5 py-3 font-medium">Cancel</button>}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 px-6 py-4"><h2 className="font-semibold">Material Catalog</h2></div>
          {loading ? <p className="p-6 text-sm text-zinc-500">Loading materials...</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 text-zinc-600"><tr><th className="px-5 py-3">Material</th><th className="px-5 py-3">Type</th><th className="px-5 py-3">Allowed Uses</th><th className="px-5 py-3">Unit</th><th className="px-5 py-3">Cost / Unit</th><th className="px-5 py-3">Supplier</th><th className="px-5 py-3 text-right">Actions</th></tr></thead>
                <tbody className="divide-y divide-zinc-100">
                  {materials.map((material) => (
                    <tr key={material.id}>
                      <td className="px-5 py-4 font-medium">{material.name}</td>
                      <td className="px-5 py-4">{material.material_type || "—"}</td>
                      <td className="px-5 py-4 text-xs text-zinc-500">{material.allowed_uses.length > 0 ? material.allowed_uses.map((use) => ALLOWED_USE_OPTIONS.find((option) => option.value === use)?.label || use).join(", ") : "Additional only"}</td>
                      <td className="px-5 py-4">{material.unit}</td>
                      <td className="px-5 py-4">₱{Number(material.cost_per_unit).toFixed(2)}</td>
                      <td className="px-5 py-4">{material.supplier || "—"}</td>
                      <td className="px-5 py-4"><div className="flex justify-end gap-2"><button onClick={() => startEdit(material)} className="rounded-md border px-3 py-1.5">Edit</button><button onClick={() => handleDelete(material.id)} className="rounded-md border px-3 py-1.5 text-red-600">Delete</button></div></td>
                    </tr>
                  ))}
                  {materials.length === 0 && <tr><td colSpan={7} className="px-5 py-8 text-center text-zinc-500">No materials yet.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
