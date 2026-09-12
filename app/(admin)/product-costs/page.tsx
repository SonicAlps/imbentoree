"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/src/lib/supabase";

type BagType = {
  id: string;
  name: string;
  labor_cost: number;
};

type Material = {
  id: string;
  name: string;
  unit: string;
  cost_per_unit: number;
  material_roles: string[];
};

type BagTypeMaterial = {
  id: string;
  bag_type_id: string;
  material_id: string | null;
  material_role: string;
  quantity_needed: number;
};

type FabricCut = {
  id: number;
  lengthCm: number;
  widthCm: number;
  quantity: number;
};

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



export default function ProductCostsPage() {
  const [bagTypes, setBagTypes] = useState<BagType[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedBagType, setSelectedBagType] =
    useState<string>("");

  const [bagTypeMaterials, setBagTypeMaterials] =
    useState<BagTypeMaterial[]>([]);

  const [laborCosts, setLaborCosts] = useState<{
    [key: string]: number;
  }>({});

  const [loading, setLoading] = useState(true);

  // Add material form
  const [selectedMaterialRole, setSelectedMaterialRole] =
    useState("");

  const [quantityNeeded, setQuantityNeeded] =
    useState<number>(0);

  // Fabric calculator
  const [fabricCuts, setFabricCuts] =
    useState<FabricCut[]>([
      {
        id: 1,
        lengthCm: 0,
        widthCm: 0,
        quantity: 1,
      },
    ]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    setLoading(true);

    const { data: bagTypesData, error: bagTypesError } =
      await supabase
        .from("bag_types")
        .select("*")
        .order("name");

    const { data: materialsData, error: materialsError } =
      await supabase
        .from("materials")
        .select("*")
        .order("name");

    if (bagTypesError) {
      console.error(
        "Failed to fetch bag types:",
        bagTypesError
      );
    }

    if (materialsError) {
      console.error(
        "Failed to fetch materials:",
        materialsError
      );
    }

    const loadedBagTypes =
      (bagTypesData as BagType[]) || [];

    const loadedMaterials =
      (materialsData as Material[]) || [];

    setBagTypes(loadedBagTypes);
    setMaterials(loadedMaterials);

    // Load labor costs from bag_types
    const costs: {
      [key: string]: number;
    } = {};

    loadedBagTypes.forEach((bagType) => {
      costs[bagType.id] =
        Number(bagType.labor_cost) || 0;
    });

    setLaborCosts(costs);

    setLoading(false);
  }

  async function handleSelectBagType(
    bagTypeId: string
  ) {
    setSelectedBagType(bagTypeId);

    await fetchBagTypeMaterials(
      bagTypeId
    );
  }

  async function fetchBagTypeMaterials(
    bagTypeId: string
  ) {
    const { data, error } = await supabase
      .from("bag_type_materials")
      .select(
        `
        id,
        bag_type_id,
        material_id,
        material_role,
        quantity_needed
      `
      )
      .eq("bag_type_id", bagTypeId);

    if (error) {
      console.error(
        "Failed to fetch bag type materials:",
        error
      );

      setBagTypeMaterials([]);
      return;
    }

    const normalizedData: BagTypeMaterial[] =
      (data || []).map((row: any) => ({
        id: row.id,
        bag_type_id: row.bag_type_id,
        material_id: row.material_id || null,
        material_role: row.material_role || "",
        quantity_needed:
          Number(row.quantity_needed) || 0,
      }));

    setBagTypeMaterials(normalizedData);
  }

  function resetMaterialForm() {
    setSelectedMaterialRole("");
    setQuantityNeeded(0);

    setFabricCuts([
      {
        id: Date.now(),
        lengthCm: 0,
        widthCm: 0,
        quantity: 1,
      },
    ]);
  }

  function addFabricCut() {
    setFabricCuts((current) => [
      ...current,
      {
        id: Date.now(),
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

  function calculateFabricCutArea(
    cut: FabricCut
  ) {
    return (
      (cut.lengthCm *
        cut.widthCm *
        cut.quantity) /
      10000
    );
  }

  const totalFabricArea =
    fabricCuts.reduce(
      (total, cut) =>
        total +
        calculateFabricCutArea(cut),
      0
    );

  async function handleAddMaterial() {
    if (
      !selectedBagType ||
      !selectedMaterialRole
    ) {
      alert("Please select a material role.");
      return;
    }

    if (!selectedRoleUnit) {
      alert(
        "No materials are assigned to this role yet. Add or edit a material in the Materials page first."
      );
      return;
    }

    let finalQuantity = quantityNeeded;

    if (selectedRoleUnit === "m²") {
      if (totalFabricArea <= 0) {
        alert(
          "Please enter at least one valid fabric cut."
        );
        return;
      }

      finalQuantity = totalFabricArea;
    } else {
      if (quantityNeeded <= 0) {
        alert(
          "Please enter a quantity greater than zero."
        );
        return;
      }
    }

    const existingRole =
      bagTypeMaterials.find(
        (item) =>
          item.material_role ===
          selectedMaterialRole
      );

    if (existingRole) {
      const newQuantity =
        existingRole.quantity_needed +
        finalQuantity;

      const { error } =
        await supabase
          .from("bag_type_materials")
          .update({
            quantity_needed: newQuantity,
          })
          .eq("id", existingRole.id);

      if (error) {
        console.error(
          "Failed to update recipe role:",
          error
        );

        alert(
          "Failed to update recipe."
        );

        return;
      }
    } else {
      const { error } =
        await supabase
          .from("bag_type_materials")
          .insert([
            {
              bag_type_id:
                selectedBagType,
              material_id: null,
              material_role:
                selectedMaterialRole,
              quantity_needed:
                finalQuantity,
            },
          ]);

      if (error) {
        console.error(
          "Failed to add recipe role:",
          error
        );

        alert(
          "Failed to add recipe."
        );

        return;
      }
    }

    resetMaterialForm();

    await fetchBagTypeMaterials(
      selectedBagType
    );
  }

  async function handleRemoveMaterial(
    bagTypeMaterialId: string
  ) {
    if (
      !confirm(
        "Remove this material from the recipe?"
      )
    ) {
      return;
    }

    const { error } =
      await supabase
        .from("bag_type_materials")
        .delete()
        .eq(
          "id",
          bagTypeMaterialId
        );

    if (error) {
      console.error(
        "Failed to remove material:",
        error
      );

      alert(
        "Failed to remove material."
      );

      return;
    }

    await fetchBagTypeMaterials(
      selectedBagType
    );
  }

  /*
   * SAVE LABOR COST
   */
  async function handleUpdateLaborCost() {
    if (!selectedBagType) {
      return;
    }

    const laborCost =
      laborCosts[selectedBagType] || 0;

    const { error } =
      await supabase
        .from("bag_types")
        .update({
          labor_cost: laborCost,
        })
        .eq(
          "id",
          selectedBagType
        );

    if (error) {
      console.error(
        "Failed to save labor cost:",
        error
      );

      alert(
        "Failed to save labor cost."
      );

      return;
    }

    // Keep local bag type data synchronized
    setBagTypes((current) =>
      current.map((bagType) =>
        bagType.id === selectedBagType
          ? {
              ...bagType,
              labor_cost: laborCost,
            }
          : bagType
      )
    );

    alert(
      `Labor cost saved: ₱${laborCost.toFixed(
        2
      )}`
    );
  }

  function getRoleMaterials(role: string) {
    return materials.filter((material) =>
      material.material_roles?.includes(role)
    );
  }

  function getRoleUnit(role: string) {
    return (
      getRoleMaterials(role)[0]?.unit || ""
    );
  }

  function getRoleCostRange(
    role: string,
    quantity: number
  ) {
    const roleMaterials =
      getRoleMaterials(role);

    if (roleMaterials.length === 0) {
      return {
        min: 0,
        max: 0,
      };
    }

    const costs = roleMaterials.map(
      (material) =>
        quantity *
        Number(material.cost_per_unit || 0)
    );

    return {
      min: Math.min(...costs),
      max: Math.max(...costs),
    };
  }

  const materialCostRange =
    bagTypeMaterials.reduce(
      (totals, item) => {
        const range = getRoleCostRange(
          item.material_role,
          item.quantity_needed
        );

        return {
          min: totals.min + range.min,
          max: totals.max + range.max,
        };
      },
      {
        min: 0,
        max: 0,
      }
    );

  const laborCost =
    laborCosts[selectedBagType] || 0;

  const totalProductionCostMin =
    materialCostRange.min + laborCost;

  const totalProductionCostMax =
    materialCostRange.max + laborCost;

  const selectedBagTypeName =
    bagTypes.find(
      (bt) =>
        bt.id === selectedBagType
    )?.name || "";
    
    
    
  const selectedRoleMaterials =
    selectedMaterialRole
      ? getRoleMaterials(
          selectedMaterialRole
        )
      : [];

  const selectedRoleUnit =
    selectedRoleMaterials.length > 0
      ? selectedRoleMaterials[0].unit
      : "";


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900">
          Product Costs
        </h1>

        <p className="mt-2 text-zinc-600">
          Configure materials, fabric
          consumption, and production costs
          for each bag type.
        </p>
      </div>

      {loading ? (
        <p className="text-zinc-600">
          Loading...
        </p>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          {/* LEFT — BAG TYPES */}
          <div className="rounded-lg border bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-zinc-900">
              Bag Types
            </h2>

            <div className="space-y-2">
              {bagTypes.map(
                (bagType) => (
                  <button
                    key={bagType.id}
                    onClick={() =>
                      handleSelectBagType(
                        bagType.id
                      )
                    }
                    className={`w-full rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors ${
                      selectedBagType ===
                      bagType.id
                        ? "bg-black text-white"
                        : "border bg-white text-zinc-900 hover:bg-zinc-50"
                    }`}
                  >
                    {bagType.name}
                  </button>
                )
              )}
            </div>
          </div>

          {/* CENTER + RIGHT */}
          {selectedBagType ? (
            <div className="space-y-6 lg:col-span-2">
              {/* ADD MATERIAL */}
              <div className="rounded-lg border bg-white p-6">
                <h2 className="mb-1 text-lg font-semibold text-zinc-900">
                  Add Material to{" "}
                  {selectedBagTypeName}
                </h2>

                <p className="mb-5 text-sm text-zinc-500">
                  Choose the role this product requires. Fabric roles use the cut calculator; other roles use their material unit.
                </p>

                {/* MATERIAL ROLE */}
<div>
  <label className="block text-sm font-medium text-zinc-700">
    Material Role
  </label>

  <select
    value={selectedMaterialRole}
    onChange={(e) => {
      setSelectedMaterialRole(
        e.target.value
      );

      setQuantityNeeded(0);

      setFabricCuts([
        {
          id: Date.now(),
          lengthCm: 0,
          widthCm: 0,
          quantity: 1,
        },
      ]);
    }}
    className="mt-1 w-full rounded border px-3 py-2"
  >
    <option value="">
      Select role...
    </option>

    {MATERIAL_ROLE_OPTIONS.map(
      (role) => (
        <option
          key={role.value}
          value={role.value}
        >
          {role.label}
        </option>
      )
    )}
  </select>
</div>



{/* FABRIC CALCULATOR */}
                {selectedRoleUnit ===
                  "m²" && (
                  <div className="mt-5 rounded-lg border bg-zinc-50 p-4">
                    <h3 className="font-semibold text-zinc-900">
                      Fabric Cut Calculator
                    </h3>

                    <p className="mt-1 text-xs text-zinc-500">
                      Enter each pattern piece.
                      The app will combine them
                      into one total m² quantity.
                    </p>

                    <div className="mt-4 space-y-3">
                      {fabricCuts.map(
                        (
                          cut
                        ) => (
                          <div
                            key={
                              cut.id
                            }
                            className="grid gap-3 sm:grid-cols-4"
                          >
                            <div>
                              <label className="block text-xs font-medium text-zinc-600">
                                Length (cm)
                              </label>

                              <input
                                type="number"
                                min="0"
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
                                    parseFloat(
                                      e.target
                                        .value
                                    ) ||
                                      0
                                  )
                                }
                                className="mt-1 w-full rounded border px-3 py-2"
                                placeholder="24"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-zinc-600">
                                Width (cm)
                              </label>

                              <input
                                type="number"
                                min="0"
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
                                    parseFloat(
                                      e.target
                                        .value
                                    ) ||
                                      0
                                  )
                                }
                                className="mt-1 w-full rounded border px-3 py-2"
                                placeholder="18"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-zinc-600">
                                Qty
                              </label>

                              <input
                                type="number"
                                min="1"
                                value={
                                  cut.quantity
                                }
                                onChange={(
                                  e
                                ) =>
                                  updateFabricCut(
                                    cut.id,
                                    "quantity",
                                    parseInt(
                                      e.target
                                        .value
                                    ) ||
                                      1
                                  )
                                }
                                className="mt-1 w-full rounded border px-3 py-2"
                              />
                            </div>

                            <div className="flex items-end gap-2">
                              <div className="flex-1">
                                <label className="block text-xs font-medium text-zinc-600">
                                  Area
                                </label>

                                <div className="mt-1 rounded border bg-white px-3 py-2 text-sm">
                                  {calculateFabricCutArea(
                                    cut
                                  ).toFixed(
                                    4
                                  )}{" "}
                                  m²
                                </div>
                              </div>

                              {fabricCuts.length >
                                1 && (
                                <button
                                  onClick={() =>
                                    removeFabricCut(
                                      cut.id
                                    )
                                  }
                                  className="rounded border px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </div>

                    <button
                      onClick={
                        addFabricCut
                      }
                      className="mt-4 rounded border px-3 py-2 text-sm text-zinc-700 hover:bg-white"
                    >
                      + Add Cut
                    </button>

                    <div className="mt-4 rounded-lg bg-white p-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-zinc-600">
                          Total Fabric Area
                        </span>

                        <span className="text-lg font-bold text-zinc-900">
                          {totalFabricArea.toFixed(
                            4
                          )}{" "}
                          m²
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-zinc-500">
                        This is the quantity
                        stored in the product
                        recipe.
                      </p>
                    </div>
                  </div>
                )}

                {/* NON-FABRIC */}
                {selectedRoleUnit &&
                  selectedRoleUnit !==
                    "m²" && (
                    <div className="mt-5">
                      <label className="block text-sm font-medium text-zinc-700">
                        Quantity Needed (
                        {
                          selectedRoleUnit
                        }
                        )
                      </label>

                      <input
                        type="number"
                        min="0"
                        value={
                          quantityNeeded ||
                          ""
                        }
                        onChange={(e) =>
                          setQuantityNeeded(
                            parseFloat(
                              e.target
                                .value
                            ) || 0
                          )
                        }
                        className="mt-1 w-full rounded border px-3 py-2"
                        placeholder="1"
                        step="0.01"
                      />
                    </div>
                  )}

                {selectedRoleUnit && (
                  <button
                    onClick={
                      handleAddMaterial
                    }
                    className="mt-5 w-full rounded bg-black px-4 py-2 text-white hover:bg-zinc-800"
                  >
                    Add Role to Recipe
                  </button>
                )}
              </div>

              {/* CURRENT RECIPE */}
              <div className="rounded-lg border bg-white p-6">
                <h2 className="mb-4 text-lg font-semibold text-zinc-900">
                  Recipe:{" "}
                  {selectedBagTypeName}
                </h2>

                {bagTypeMaterials.length ===
                0 ? (
                  <p className="text-sm text-zinc-600">
                    No materials added yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {bagTypeMaterials.map(
                      (item) => {
                        const roleLabel =
                          MATERIAL_ROLE_OPTIONS.find(
                            (role) =>
                              role.value ===
                              item.material_role
                          )?.label ||
                          item.material_role;

                        const roleUnit =
                          getRoleUnit(
                            item.material_role
                          );

                        const itemRange =
                          getRoleCostRange(
                            item.material_role,
                            item.quantity_needed
                          );

                        return (
                          <div
                            key={item.id}
                            className="flex items-center justify-between rounded-lg bg-zinc-50 p-3"
                          >
                            <div>
                              <p className="text-sm font-medium text-zinc-900">
                                {roleLabel}
                              </p>

                              <p className="text-xs text-zinc-600">
                                {item.quantity_needed.toFixed(
                                  4
                                )}{" "}
                                {roleUnit || "unit"}
                              </p>

                              <p className="mt-1 text-xs text-zinc-500">
                                Estimated material cost: ₱
                                {itemRange.min.toFixed(
                                  2
                                )}
                                {itemRange.max !==
                                itemRange.min
                                  ? ` – ₱${itemRange.max.toFixed(
                                      2
                                    )}`
                                  : ""}
                              </p>
                            </div>

                            <button
                              onClick={() =>
                                handleRemoveMaterial(
                                  item.id
                                )
                              }
                              className="text-red-600 hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </div>

              {/* COST BREAKDOWN */}
              <div className="rounded-lg border bg-white p-6">
                <h2 className="mb-4 text-lg font-semibold text-zinc-900">
                  Cost Breakdown
                </h2>

                <div className="space-y-3">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-sm text-zinc-600">
                      Material Cost
                    </span>

                    <span className="text-sm font-medium text-zinc-900">
                      ₱
                      {materialCostRange.min.toFixed(
                        2
                      )}
                      {materialCostRange.max !==
                      materialCostRange.min
                        ? ` – ₱${materialCostRange.max.toFixed(
                            2
                          )}`
                        : ""}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700">
                      Labor Cost (₱)
                    </label>

                    <div className="mt-2 flex gap-2">
                      <input
                        type="number"
                        min="0"
                        value={
                          laborCosts[
                            selectedBagType
                          ] || ""
                        }
                        onChange={(e) =>
                          setLaborCosts(
                            (
                              current
                            ) => ({
                              ...current,
                              [selectedBagType]:
                                parseFloat(
                                  e.target
                                    .value
                                ) || 0,
                            })
                          )
                        }
                        className="flex-1 rounded border px-3 py-2"
                        placeholder="0.00"
                        step="0.01"
                      />

                      <button
                        type="button"
                        onClick={
                          handleUpdateLaborCost
                        }
                        className="rounded bg-black px-4 py-2 text-white hover:bg-zinc-800"
                      >
                        Set
                      </button>
                    </div>
                  </div>

                  <div className="rounded-lg bg-green-50 p-3">
                    <p className="text-xs text-zinc-600">
                      Total Production Cost
                    </p>

                    <p className="text-2xl font-bold text-green-600">
                      ₱
                      {totalProductionCostMin.toFixed(
                        2
                      )}
                      {totalProductionCostMax !==
                      totalProductionCostMin
                        ? ` – ₱${totalProductionCostMax.toFixed(
                            2
                          )}`
                        : ""}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border bg-zinc-50 p-6 text-center lg:col-span-2">
              <p className="text-zinc-600">
                Select a bag type to configure
                materials.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}