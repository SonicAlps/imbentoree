"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/src/lib/supabase";

type Material = {
  id: string;
  name: string;
  unit: string;
  cost_per_unit: number;
  supplier: string | null;
  created_at: string;
};

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("meter");
  const [costPerUnit, setCostPerUnit] = useState<number>(0);
  const [supplier, setSupplier] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchMaterials();
  }, []);

  async function fetchMaterials() {
    setLoading(true);
    const { data, error } = await supabase
      .from("materials")
      .select("*")
      .order("name");

    if (error) {
      console.error("Failed to fetch materials:", error);
    } else {
      setMaterials(data || []);
    }
    setLoading(false);
  }

  async function handleSave() {
    if (!name || costPerUnit <= 0) {
      alert("Please fill in all required fields.");
      return;
    }

    if (editingId) {
      // Update existing
      const { error } = await supabase
        .from("materials")
        .update({
          name,
          unit,
          cost_per_unit: costPerUnit,
          supplier,
        })
        .eq("id", editingId);

      if (error) {
        console.error("Update failed:", error);
        alert("Failed to update material.");
        return;
      }
    } else {
      // Create new
      const { error } = await supabase.from("materials").insert([
        {
          name,
          unit,
          cost_per_unit: costPerUnit,
          supplier,
        },
      ]);

      if (error) {
        console.error("Insert failed:", error);
        alert("Failed to create material.");
        return;
      }
    }

    // Reset form
    setName("");
    setUnit("meter");
    setCostPerUnit(0);
    setSupplier("");
    setEditingId(null);
    setIsAdding(false);

    // Refresh list
    await fetchMaterials();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this material?")) return;

    const { error } = await supabase
      .from("materials")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete material.");
      return;
    }

    await fetchMaterials();
  }

  function handleEdit(material: Material) {
    setName(material.name);
    setUnit(material.unit);
    setCostPerUnit(material.cost_per_unit);
    setSupplier(material.supplier || "");
    setEditingId(material.id);
    setIsAdding(true);
  }

  function resetForm() {
    setName("");
    setUnit("meter");
    setCostPerUnit(0);
    setSupplier("");
    setEditingId(null);
    setIsAdding(false);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900">Materials</h1>
        <p className="mt-2 text-zinc-600">
          Manage raw materials and their costs.
        </p>
      </div>

      {/* Add/Edit Form */}
      {isAdding && (
        <div className="rounded-lg border bg-zinc-50 p-6">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">
            {editingId ? "Edit Material" : "Add Material"}
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-zinc-700">
                Material Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2"
                placeholder="e.g., Canvas Black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700">
                Unit *
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2"
              >
                <option value="meter">Meter</option>
                <option value="piece">Piece</option>
                <option value="spool">Spool</option>
                <option value="kg">Kilogram</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700">
                Cost per Unit (₱) *
              </label>
              <input
                type="number"
                value={costPerUnit}
                onChange={(e) => setCostPerUnit(parseFloat(e.target.value))}
                className="mt-1 w-full rounded border px-3 py-2"
                placeholder="0.00"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700">
                Supplier
              </label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2"
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={handleSave}
              className="rounded bg-black px-4 py-2 text-white hover:bg-zinc-800"
            >
              {editingId ? "Update" : "Add"} Material
            </button>
            <button
              onClick={resetForm}
              className="rounded border px-4 py-2 text-zinc-700 hover:bg-zinc-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!isAdding && (
        <button
          onClick={() => setIsAdding(true)}
          className="rounded bg-black px-4 py-2 text-white hover:bg-zinc-800"
        >
          + Add Material
        </button>
      )}

      {/* Materials Table */}
      {loading ? (
        <p className="text-zinc-600">Loading materials...</p>
      ) : materials.length === 0 ? (
        <p className="text-zinc-600">No materials yet. Add one to get started.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900">
                  Unit
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900">
                  Cost per Unit
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900">
                  Supplier
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {materials.map((material) => (
                <tr key={material.id} className="border-t">
                  <td className="px-4 py-3 text-sm text-zinc-900">
                    {material.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-600">
                    {material.unit}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-900">
                    ₱{material.cost_per_unit.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-600">
                    {material.supplier || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => handleEdit(material)}
                      className="mr-2 text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(material.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}