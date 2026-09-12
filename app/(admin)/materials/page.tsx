"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/src/lib/supabase";

type Material = {
  id: string;
  name: string;
  unit: string;
  cost_per_unit: number;
  supplier: string | null;

  purchase_length_m: number | null;
  purchase_width_m: number | null;
  purchase_price: number | null;

  purchase_quantity: number | null;
  purchase_unit_amount: number | null;

  material_roles: string[];

  created_at: string;
};

const UNIT_OPTIONS = [
  {
    value: "m²",
    label: "Square meter (m²)",
    shortLabel: "m²",
  },
  {
    value: "meter",
    label: "Meter (m)",
    shortLabel: "m",
  },
  {
    value: "yard",
    label: "Yard (yd)",
    shortLabel: "yd",
  },
  {
    value: "piece",
    label: "Piece (pc)",
    shortLabel: "pc",
  },
  {
    value: "spool",
    label: "Spool",
    shortLabel: "spool",
  },
  {
    value: "kg",
    label: "Kilogram (kg)",
    shortLabel: "kg",
  },
];

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // Basic material information
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("meter");
  const [supplier, setSupplier] = useState("");

  // Fabric purchase information
  const [purchaseLengthM, setPurchaseLengthM] =
    useState<number>(0);

  const [purchaseWidthM, setPurchaseWidthM] =
    useState<number>(0);

  // Generic purchase information
  const [purchaseQuantity, setPurchaseQuantity] =
    useState<number>(0);

  const [purchaseUnitAmount, setPurchaseUnitAmount] =
    useState<number>(0);

  const [purchasePrice, setPurchasePrice] =
    useState<number>(0);
    
  const [materialRoles, setMaterialRoles] =
  useState<string[]>([]);

  const [editingId, setEditingId] =
    useState<string | null>(null);

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
      console.error(
        "Failed to fetch materials:",
        error
      );
    } else {
      setMaterials(data || []);
    }

    setLoading(false);
  }

  function getUnitInfo(unitValue: string) {
    return (
      UNIT_OPTIONS.find(
        (option) => option.value === unitValue
      ) || UNIT_OPTIONS[0]
    );
  }

  const MATERIAL_ROLE_OPTIONS = [
  {
    value: "outer_fabric",
    label: "Outer Fabric",
  },
  {
    value: "inner_fabric",
    label: "Inner Fabric",
  },
  {
    value: "strap",
    label: "Strap",
  },
  {
    value: "hardware",
    label: "Hardware",
  },
];

  /*
   * ==========================================
   * FABRIC CALCULATION
   * ==========================================
   *
   * Example:
   *
   * 1m × 1.5m = 1.5m²
   * ₱400 ÷ 1.5m² = ₱266.67/m²
   */

  const purchasedFabricArea =
    purchaseLengthM > 0 &&
    purchaseWidthM > 0
      ? purchaseLengthM * purchaseWidthM
      : 0;

  const calculatedFabricCostPerM2 =
    purchasedFabricArea > 0 &&
    purchasePrice > 0
      ? purchasePrice / purchasedFabricArea
      : 0;

  /*
   * ==========================================
   * GENERIC MATERIAL CALCULATION
   * ==========================================
   *
   * Example:
   *
   * 1 roll × 3 yards
   * ₱300 total
   *
   * Total = 3 yards
   * Cost = ₱100/yard
   */

  const totalPurchasedAmount =
    purchaseQuantity > 0 &&
    purchaseUnitAmount > 0
      ? purchaseQuantity *
        purchaseUnitAmount
      : 0;

  const calculatedCostPerUnit =
    totalPurchasedAmount > 0 &&
    purchasePrice > 0
      ? purchasePrice /
        totalPurchasedAmount
      : 0;

  async function handleSave() {
    if (!name.trim()) {
      alert("Please enter a material name.");
      return;
    }

    let finalCostPerUnit = 0;

    /*
     * FABRIC
     */
    if (unit === "m²") {
      if (
        purchaseLengthM <= 0 ||
        purchaseWidthM <= 0 ||
        purchasePrice <= 0
      ) {
        alert(
          "Please enter the fabric length, width, and purchase price."
        );
        return;
      }

      finalCostPerUnit =
        calculatedFabricCostPerM2;
    }

    /*
     * ALL OTHER UNITS
     */
    else {
      if (
        purchaseQuantity <= 0 ||
        purchaseUnitAmount <= 0 ||
        purchasePrice <= 0
      ) {
        alert(
          "Please enter the purchase quantity, amount per purchase unit, and purchase price."
        );
        return;
      }

      finalCostPerUnit =
        calculatedCostPerUnit;
    }

    const materialData = {
  name: name.trim(),
  unit,
  cost_per_unit: finalCostPerUnit,
  supplier:
    supplier.trim() || null,

  material_roles: materialRoles,

  /*
   * Fabric-specific fields
   */
  purchase_length_m:
    unit === "m²"
      ? purchaseLengthM
      : null,

  purchase_width_m:
    unit === "m²"
      ? purchaseWidthM
      : null,

  /*
   * Generic purchase fields
   */
  purchase_quantity:
    unit === "m²"
      ? null
      : purchaseQuantity,

  purchase_unit_amount:
    unit === "m²"
      ? null
      : purchaseUnitAmount,

  purchase_price: purchasePrice,
};

    if (editingId) {
      const { error } = await supabase
        .from("materials")
        .update(materialData)
        .eq("id", editingId);

      if (error) {
        console.error(
          "Update failed:",
          error
        );

        alert(
          "Failed to update material."
        );

        return;
      }
    } else {
      const { error } = await supabase
        .from("materials")
        .insert([materialData]);

      if (error) {
        console.error(
          "Insert failed:",
          error
        );

        alert(
          "Failed to create material."
        );

        return;
      }
    }

    resetForm();
    await fetchMaterials();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this material?")) {
      return;
    }

    const { error } = await supabase
      .from("materials")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(
        "Delete failed:",
        error
      );

      alert(
        "Failed to delete material."
      );

      return;
    }

    await fetchMaterials();
  }

  function handleEdit(material: Material) {
    setName(material.name);
    setUnit(material.unit);

    setSupplier(
      material.supplier || ""
    );

      setMaterialRoles(
       material.material_roles || []
    );


    setPurchaseLengthM(
      material.purchase_length_m || 0
    );

    setPurchaseWidthM(
      material.purchase_width_m || 0
    );

    setPurchaseQuantity(
      material.purchase_quantity || 0
    );

    setPurchaseUnitAmount(
      material.purchase_unit_amount || 0
    );

    setPurchasePrice(
      material.purchase_price || 0
    );

  
    setEditingId(material.id);
    setIsAdding(true);
  }

  function resetForm() {
    setName("");
    setUnit("meter");
    setSupplier("");

    setMaterialRoles([]);

    setPurchaseLengthM(0);
    setPurchaseWidthM(0);

    setPurchaseQuantity(0);
    setPurchaseUnitAmount(0);

    setPurchasePrice(0);

    setEditingId(null);
    setIsAdding(false);
  }

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-zinc-900">
          Materials
        </h1>

        <p className="mt-2 text-zinc-600">
          Manage raw materials, purchase
          information, and costing.
        </p>
      </div>

      {/* ADD / EDIT FORM */}
      {isAdding && (
        <div className="rounded-lg border bg-zinc-50 p-6">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">
            {editingId
              ? "Edit Material"
              : "Add Material"}
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* MATERIAL NAME */}
            <div>
              <label className="block text-sm font-medium text-zinc-700">
                Material Name *
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                className="mt-1 w-full rounded border px-3 py-2"
                placeholder="e.g., 1 inch Nylon Webbing"
              />
            </div>

            {/* COSTING UNIT */}
            <div>
              <label className="block text-sm font-medium text-zinc-700">
                Costing Unit *
              </label>

              <select
                value={unit}
                onChange={(e) => {
                  setUnit(e.target.value);

                  setPurchaseLengthM(0);
                  setPurchaseWidthM(0);
                  setPurchaseQuantity(0);
                  setPurchaseUnitAmount(0);
                  setPurchasePrice(0);
                }}
                className="mt-1 w-full rounded border px-3 py-2"
              >
                {UNIT_OPTIONS.map(
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

            {/* ==================================
                FABRIC
                ================================== */}
            {unit === "m²" ? (
              <div className="sm:col-span-2">
                <div className="rounded-lg border bg-white p-5">
                  <h3 className="font-semibold text-zinc-900">
                    Fabric Purchase
                  </h3>

                  <p className="mt-1 text-sm text-zinc-500">
                    Enter the actual dimensions
                    and price of the fabric you
                    bought. Imbentoree calculates
                    the cost per m² automatically.
                  </p>

                  <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    {/* LENGTH */}
                    <div>
                      <label className="block text-sm font-medium text-zinc-700">
                        Length (m)
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          purchaseLengthM || ""
                        }
                        onChange={(e) =>
                          setPurchaseLengthM(
                            parseFloat(
                              e.target.value
                            ) || 0
                          )
                        }
                        className="mt-1 w-full rounded border px-3 py-2"
                        placeholder="1"
                      />
                    </div>

                    {/* WIDTH */}
                    <div>
                      <label className="block text-sm font-medium text-zinc-700">
                        Width (m)
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          purchaseWidthM || ""
                        }
                        onChange={(e) =>
                          setPurchaseWidthM(
                            parseFloat(
                              e.target.value
                            ) || 0
                          )
                        }
                        className="mt-1 w-full rounded border px-3 py-2"
                        placeholder="1.5"
                      />
                    </div>

                    {/* PRICE */}
                    <div>
                      <label className="block text-sm font-medium text-zinc-700">
                        Purchase Price (₱)
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          purchasePrice || ""
                        }
                        onChange={(e) =>
                          setPurchasePrice(
                            parseFloat(
                              e.target.value
                            ) || 0
                          )
                        }
                        className="mt-1 w-full rounded border px-3 py-2"
                        placeholder="400"
                      />
                    </div>
                  </div>

                  {/* FABRIC RESULT */}
                  {purchasedFabricArea >
                    0 &&
                    purchasePrice > 0 && (
                      <div className="mt-5 rounded-lg bg-zinc-50 p-4">
                        <div className="grid gap-3 sm:grid-cols-3">
                          <div>
                            <p className="text-xs text-zinc-500">
                              Purchased Area
                            </p>

                            <p className="text-lg font-semibold text-zinc-900">
                              {purchasedFabricArea.toFixed(
                                2
                              )}{" "}
                              m²
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-zinc-500">
                              Purchase Price
                            </p>

                            <p className="text-lg font-semibold text-zinc-900">
                              ₱
                              {purchasePrice.toFixed(
                                2
                              )}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-zinc-500">
                              Cost per m²
                            </p>

                            <p className="text-lg font-bold text-green-600">
                              ₱
                              {calculatedFabricCostPerM2.toFixed(
                                2
                              )}
                            </p>
                          </div>
                        </div>

                        <p className="mt-3 text-xs text-zinc-500">
                          ₱
                          {purchasePrice.toFixed(
                            2
                          )}{" "}
                          ÷{" "}
                          {purchasedFabricArea.toFixed(
                            2
                          )}{" "}
                          m² = ₱
                          {calculatedFabricCostPerM2.toFixed(
                            2
                          )}
                          /m²
                        </p>
                      </div>
                    )}
                </div>
              </div>
            ) : (
              /* ==================================
                 OTHER MATERIALS
                 ================================== */
              <div className="sm:col-span-2">
                <div className="rounded-lg border bg-white p-5">
                  <h3 className="font-semibold text-zinc-900">
                    Purchase Information
                  </h3>

                  <p className="mt-1 text-sm text-zinc-500">
                    Enter what you actually
                    bought. Imbentoree will calculate
                    the cost per{" "}
                    {
                      getUnitInfo(unit)
                        .shortLabel
                    }{" "}
                    automatically.
                  </p>

                  <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    {/* PURCHASE QUANTITY */}
                    <div>
                      <label className="block text-sm font-medium text-zinc-700">
                        Purchase Quantity
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          purchaseQuantity ||
                          ""
                        }
                        onChange={(e) =>
                          setPurchaseQuantity(
                            parseFloat(
                              e.target.value
                            ) || 0
                          )
                        }
                        className="mt-1 w-full rounded border px-3 py-2"
                        placeholder="1"
                      />

                      <p className="mt-1 text-xs text-zinc-500">
                        Number of rolls, packs,
                        or purchase units
                      </p>
                    </div>

                    {/* AMOUNT PER PURCHASE UNIT */}
                    <div>
                      <label className="block text-sm font-medium text-zinc-700">
                        Amount per Purchase Unit (
                        {
                          getUnitInfo(unit)
                            .shortLabel
                        }
                        )
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          purchaseUnitAmount ||
                          ""
                        }
                        onChange={(e) =>
                          setPurchaseUnitAmount(
                            parseFloat(
                              e.target.value
                            ) || 0
                          )
                        }
                        className="mt-1 w-full rounded border px-3 py-2"
                        placeholder="3"
                      />

                      <p className="mt-1 text-xs text-zinc-500">
                        Amount contained in each
                        roll, pack, or purchase unit
                      </p>
                    </div>

                    {/* PURCHASE PRICE */}
                    <div>
                      <label className="block text-sm font-medium text-zinc-700">
                        Purchase Price (₱)
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          purchasePrice || ""
                        }
                        onChange={(e) =>
                          setPurchasePrice(
                            parseFloat(
                              e.target.value
                            ) || 0
                          )
                        }
                        className="mt-1 w-full rounded border px-3 py-2"
                        placeholder="300"
                      />
                    </div>
                  </div>

                  {/* GENERIC RESULT */}
                  {totalPurchasedAmount >
                    0 &&
                    purchasePrice > 0 && (
                      <div className="mt-5 rounded-lg bg-zinc-50 p-4">
                        <div className="grid gap-3 sm:grid-cols-3">
                          <div>
                            <p className="text-xs text-zinc-500">
                              Total Material Purchased
                            </p>

                            <p className="text-lg font-semibold text-zinc-900">
                              {
                                totalPurchasedAmount
                              }{" "}
                              {
                                getUnitInfo(
                                  unit
                                ).shortLabel
                              }
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-zinc-500">
                              Purchase Price
                            </p>

                            <p className="text-lg font-semibold text-zinc-900">
                              ₱
                              {purchasePrice.toFixed(
                                2
                              )}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-zinc-500">
                              Cost per{" "}
                              {
                                getUnitInfo(
                                  unit
                                ).shortLabel
                              }
                            </p>

                            <p className="text-lg font-bold text-green-600">
                              ₱
                              {calculatedCostPerUnit.toFixed(
                                2
                              )}
                            </p>
                          </div>
                        </div>

                        <p className="mt-3 text-xs text-zinc-500">
                          ₱
                          {purchasePrice.toFixed(
                            2
                          )}{" "}
                          ÷{" "}
                          {
                            totalPurchasedAmount
                          }{" "}
                          {
                            getUnitInfo(
                              unit
                            ).shortLabel
                          }{" "}
                          = ₱
                          {calculatedCostPerUnit.toFixed(
                            2
                          )}
                          /{
                            getUnitInfo(
                              unit
                            ).shortLabel
                          }
                        </p>
                      </div>
                    )}
                </div>
              </div>
            )}

            {/* SUPPLIER */}
            <div>
              <label className="block text-sm font-medium text-zinc-700">
                Supplier
              </label>

              <input
                type="text"
                value={supplier}
                onChange={(e) =>
                  setSupplier(
                    e.target.value
                  )
                }
                className="mt-1 w-full rounded border px-3 py-2"
                placeholder="Optional"
              />
            </div>



            
          </div>

        

          {/* MATERIAL ROLES */}
<div className="sm:col-span-2">

  <div className="rounded-lg border bg-white p-5">
    <h3 className="font-semibold text-zinc-900">
      Used As
    </h3>

    <p className="mt-1 text-sm text-zinc-500">
      Select where this material can be used in a bag.
      A material can have more than one role.
    </p>

    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {MATERIAL_ROLE_OPTIONS.map((role) => (
        <label
          key={role.value}
          className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-zinc-50"
        >
          <input
            type="checkbox"
            checked={materialRoles.includes(
              role.value
            )}
            onChange={(e) => {
              if (e.target.checked) {
                setMaterialRoles((current) => [
                  ...current,
                  role.value,
                ]);
              } else {
                setMaterialRoles((current) =>
                  current.filter(
                    (value) =>
                      value !== role.value
                  )
                );
              }
            }}
            className="h-4 w-4"
          />

          <span className="text-sm font-medium text-zinc-800">
            {role.label}
          </span>
        </label>
      ))}
    </div>
  </div>
</div>

          {/* ACTIONS */}
          <div className="mt-5 flex gap-2">
            <button
              onClick={handleSave}
              className="rounded bg-black px-4 py-2 text-white hover:bg-zinc-800"
            >
              {editingId
                ? "Update"
                : "Add"}{" "}
              Material
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

      {/* ADD BUTTON */}
      {!isAdding && (
        <button
          onClick={() =>
            setIsAdding(true)
          }
          className="rounded bg-black px-4 py-2 text-white hover:bg-zinc-800"
        >
          + Add Material
        </button>
      )}

      {/* MATERIAL TABLE */}
      {loading ? (
        <p className="text-zinc-600">
          Loading materials...
        </p>
      ) : materials.length === 0 ? (
        <p className="text-zinc-600">
          No materials yet. Add one to get
          started.
        </p>
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
                  Cost
                </th>

                <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900">
                  Purchase
                </th>

                <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900">
                  Supplier
                </th>
                
                <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900">
                    Used As
                </th>

                <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {materials.map(
                (material) => (
                  <tr
  key={material.id}
  className="border-t"
>
  <td className="px-4 py-3 text-sm text-zinc-900">
    {material.name}
  </td>

  <td className="px-4 py-3 text-sm text-zinc-600">
    {
      getUnitInfo(
        material.unit
      ).label
    }
  </td>

  <td className="px-4 py-3 text-sm text-zinc-900">
    ₱
    {material.cost_per_unit.toFixed(
      2
    )}{" "}
    /{" "}
    {
      getUnitInfo(
        material.unit
      ).shortLabel
    }
  </td>

  <td className="px-4 py-3 text-sm text-zinc-600">
    {material.unit ===
      "m²" &&
    material.purchase_length_m &&
    material.purchase_width_m &&
    material.purchase_price ? (
      <>
        {
          material.purchase_length_m
        }
        m ×{" "}
        {
          material.purchase_width_m
        }
        m
        <br />
        ₱
        {material.purchase_price.toFixed(
          2
        )}
      </>
    ) : material.purchase_quantity &&
      material.purchase_unit_amount &&
      material.purchase_price ? (
      <>
        {
          material.purchase_quantity
        }{" "}
        purchase unit
        {material.purchase_quantity !==
        1
          ? "s"
          : ""}{" "}
        ×{" "}
        {
          material.purchase_unit_amount
        }{" "}
        {
          getUnitInfo(
            material.unit
          ).shortLabel
        }
        <br />
        ₱
        {material.purchase_price.toFixed(
          2
        )}
      </>
    ) : (
      "—"
    )}
  </td>

  <td className="px-4 py-3 text-sm text-zinc-600">
    {material.supplier ||
      "—"}
  </td>

  {/* NEW: USED AS */}
  <td className="px-4 py-3 text-sm text-zinc-600">
    {material.material_roles &&
    material.material_roles.length > 0 ? (
      <div className="flex flex-wrap gap-1">
        {material.material_roles.map(
          (role) => {
            const roleInfo =
              MATERIAL_ROLE_OPTIONS.find(
                (option) =>
                  option.value === role
              );

            return (
              <span
                key={role}
                className="rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-700"
              >
                {roleInfo?.label ||
                  role}
              </span>
            );
          }
        )}
      </div>
    ) : (
      "—"
    )}
  </td>

  {/* ACTIONS */}
  <td className="px-4 py-3 text-sm">
    <button
      onClick={() =>
        handleEdit(
          material
        )
      }
      className="mr-2 text-blue-600 hover:underline"
    >
      Edit
    </button>

    <button
      onClick={() =>
        handleDelete(
          material.id
        )
      }
      className="text-red-600 hover:underline"
    >
      Delete
    </button>
  </td>
</tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}