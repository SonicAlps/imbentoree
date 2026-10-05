"use client";

import {

  useEffect,

  useMemo,

  useState,

} from "react";

import {

  Calculator,

  Clock3,

  History,

  Plus,

  Save,

  Trash2,

  WalletCards,

} from "lucide-react";

import { supabase } from "@/src/lib/supabase";

type Product = {

  id: string;

  name: string;

  base_price: number;

  labor_cost: number;

  active: boolean;

};

type Material = {

  id: string;

  name: string;

  material_type: string | null;

  allowed_uses: string[] | null;

  unit: string;

  cost_per_unit: number;

};

type RecipeItem = {

  id: string;

  product_id: string;

  material_id: string;

  material_role: string;

  quantity_needed: number;

  created_at: string;

};

type CostHistoryRow = {

  id: string;

  product_name: string;

  cost: number;

  effective_from: string;

  created_at: string;

};

type FabricCut = {

  id: number;

  lengthCm: number;

  widthCm: number;

  quantity: number;

};

type Tab =

  | "costing"

  | "calculator"

  | "labor"

  | "history";

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

    value: "strap_mounting",

    label: "Strap Mounting",

  },

  {

    value: "hardware",

    label: "Hardware",

  },

];

function peso(value: number) {

  return new Intl.NumberFormat("en-PH", {

    style: "currency",

    currency: "PHP",

  }).format(value);

}

function todayLocal() {

  const now = new Date();

  const year =

    now.getFullYear();

  const month =

    String(

      now.getMonth() + 1

    ).padStart(2, "0");

  const day =

    String(

      now.getDate()

    ).padStart(2, "0");

  return `${year}-${month}-${day}`;

}

function roleLabel(value: string) {

  return (

    MATERIAL_ROLE_OPTIONS.find(

      (option) =>

        option.value === value

    )?.label ?? value

  );

}

export default function CostHistoryPage() {

  const [

    products,

    setProducts,

  ] =

    useState<Product[]>([]);

  const [

    materials,

    setMaterials,

  ] =

    useState<Material[]>([]);

  const [

    recipe,

    setRecipe,

  ] =

    useState<RecipeItem[]>([]);

  const [

    history,

    setHistory,

  ] =

    useState<

      CostHistoryRow[]

    >([]);

  const [

    loading,

    setLoading,

  ] =

    useState(true);

  const [

    selectedProductId,

    setSelectedProductId,

  ] =

    useState("");

  const [

    tab,

    setTab,

  ] =

    useState<Tab>(

      "costing"

    );

  const [

    selectedRole,

    setSelectedRole,

  ] =

    useState("");

  const [

    selectedMaterialId,

    setSelectedMaterialId,

  ] =

    useState("");

  const [

    quantity,

    setQuantity,

  ] =

    useState("");

  const [

    laborCost,

    setLaborCost,

  ] =

    useState("");

  const [

    savingLabor,

    setSavingLabor,

  ] =

    useState(false);

  const [

    effectiveDate,

    setEffectiveDate,

  ] =

    useState(

      todayLocal()

    );

  const [

    fabricCuts,

    setFabricCuts,

  ] =

    useState<FabricCut[]>([

      {

        id: 1,

        lengthCm: 0,

        widthCm: 0,

        quantity: 1,

      },

    ]);

  const [

    linearMaterialId,

    setLinearMaterialId,

  ] = useState("");

  const [

    linearLength,

    setLinearLength,

  ] = useState("");

  const [

    linearInputUnit,

    setLinearInputUnit,

  ] = useState<"cm" | "meter" | "yard">("cm");

  const [

    linearQuantity,

    setLinearQuantity,

  ] = useState("1");

  useEffect(() => {

    void loadInitialData();

  }, []);

  useEffect(() => {

    if (

      !selectedProductId

    ) {

      return;

    }

    void loadProductData(

      selectedProductId

    );

  }, [selectedProductId]);

  async function loadInitialData() {

    setLoading(true);

    const [

      productsResult,

      materialsResult,

    ] =

      await Promise.all([

        supabase

          .from("products")

          .select(

            `

            id,

            name,

            base_price,

            labor_cost,

            active

            `

          )

          .eq(

            "active",

            true

          )

          .order("name"),

        supabase

          .from("materials")

          .select(

            `

            id,

            name,

            material_type,

            allowed_uses,

            unit,

            cost_per_unit

            `

          )

          .order("name"),

      ]);

    if (

      productsResult.error

    ) {

      alert(

        productsResult

          .error.message

      );

    }

    if (

      materialsResult.error

    ) {

      alert(

        materialsResult

          .error.message

      );

    }

    const loadedProducts =

      (

        productsResult.data ??

        []

      ) as Product[];

    setProducts(

      loadedProducts

    );

    setMaterials(

      (

        materialsResult.data ??

        []

      ) as Material[]

    );

    if (

      loadedProducts.length >

        0

    ) {

      setSelectedProductId(

        loadedProducts[0].id

      );

    }

    setLoading(false);

  }

  async function loadProductData(

    productId: string

  ) {

    const product =

      products.find(

        (item) =>

          item.id ===

          productId

      );

    if (!product) {

      return;

    }

    const [

      recipeResult,

      historyResult,

    ] =

      await Promise.all([

        supabase

          .from(

            "product_recipe_items"

          )

          .select(

            `

            id,

            product_id,

            material_id,

            material_role,

            quantity_needed,

            created_at

            `

          )

          .eq(

            "product_id",

            productId

          )

          .order(

            "created_at"

          ),

        supabase

          .from(

            "product_cost_history"

          )

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

            product.name

          )

          .order(

            "effective_from",

            {

              ascending:

                false,

            }

          ),

      ]);

    if (

      recipeResult.error

    ) {

      alert(

        recipeResult

          .error.message

      );

    }

    if (

      historyResult.error

    ) {

      alert(

        historyResult

          .error.message

      );

    }

    setRecipe(

      (

        recipeResult.data ??

        []

      ) as RecipeItem[]

    );

    setHistory(

      (

        historyResult.data ??

        []

      ) as CostHistoryRow[]

    );

    setLaborCost(

      String(

        Number(

          product.labor_cost

        ) || 0

      )

    );

  }

  const selectedProduct =

    useMemo(

      () =>

        products.find(

          (product) =>

            product.id ===

            selectedProductId

        ) ?? null,

      [

        products,

        selectedProductId,

      ]

    );

  const availableMaterials =

    useMemo(() => {

      if (

        !selectedRole

      ) {

        return [];

      }

      return materials.filter(

        (material) =>

          material.allowed_uses?.includes(

            selectedRole

          )

      );

    }, [

      materials,

      selectedRole,

    ]);

  function getMaterial(

    materialId: string

  ) {

    return (

      materials.find(

        (material) =>

          material.id ===

          materialId

      ) ?? null

    );

  }

  const materialCost =

    useMemo(() => {

      return recipe.reduce(

        (

          total,

          recipeItem

        ) => {

          const material =

            getMaterial(

              recipeItem.material_id

            );

          if (

            !material

          ) {

            return total;

          }

          return (

            total +

            Number(

              recipeItem.quantity_needed

            ) *

              Number(

                material.cost_per_unit

              )

          );

        },

        0

      );

    }, [

      recipe,

      materials,

    ]);

  const currentLaborCost =

    Number(

      laborCost

    ) || 0;

  const estimatedCost =

    materialCost +

    currentLaborCost;

  const sellingPrice =

    Number(

      selectedProduct

        ?.base_price ?? 0

    );

  const grossProfit =

    sellingPrice -

    estimatedCost;

  const grossMargin =

    sellingPrice > 0

      ? (

          grossProfit /

          sellingPrice

        ) *

        100

      : 0;

  const markup =

    estimatedCost > 0

      ? (

          grossProfit /

          estimatedCost

        ) *

        100

      : 0;

  const totalFabricArea =

    useMemo(() => {

      return fabricCuts.reduce(

        (

          total,

          cut

        ) => {

          const length =

            Number(

              cut.lengthCm

            ) || 0;

          const width =

            Number(

              cut.widthCm

            ) || 0;

          const count =

            Number(

              cut.quantity

            ) || 0;

          return (

            total +

            (length *

              width *

              count) /

              10000

          );

        },

        0

      );

    }, [fabricCuts]);

  const linearMaterials =

    useMemo(() => {

      return materials.filter((material) => {

        const unit = material.unit?.trim().toLowerCase();

        // materials.unit is the STANDARD COSTING UNIT.
        // Supplier purchase units are normalized on the Materials page,
        // so Cost History never needs to guess whether a fabric bought by
        // yard should be treated as area or length.
        return unit === "meter" || unit === "metre" || unit === "yard";

      });

    }, [materials]);

  const selectedLinearMaterial =

    useMemo(() => {

      return (

        linearMaterials.find(

          (material) =>

            material.id ===

            linearMaterialId

        ) ?? null

      );

    }, [

      linearMaterials,

      linearMaterialId,

    ]);

  const linearLengthMeters =

    useMemo(() => {

      const length =

        Number(linearLength) || 0;

      const count =

        Number(linearQuantity) || 0;

      let meters = length;

      if (linearInputUnit === "cm") {

        meters = length / 100;

      }

      if (linearInputUnit === "yard") {

        meters = length * 0.9144;

      }

      return meters * count;

    }, [

      linearLength,

      linearInputUnit,

      linearQuantity,

    ]);

  const linearLengthYards =

    linearLengthMeters / 0.9144;

  const linearMaterialQuantity =

    useMemo(() => {

      if (!selectedLinearMaterial) {

        return 0;

      }

      const unit =

        selectedLinearMaterial.unit

          ?.trim()

          .toLowerCase();

      return unit === "yard"

        ? linearLengthYards

        : linearLengthMeters;

    }, [

      selectedLinearMaterial,

      linearLengthMeters,

      linearLengthYards,

    ]);

  const linearEstimatedCost =

    selectedLinearMaterial

      ? linearMaterialQuantity *

        Number(

          selectedLinearMaterial.cost_per_unit

        )

      : 0;

  async function addRecipeItem() {

    if (

      !selectedProductId

    ) {

      return;

    }

    if (

      !selectedRole

    ) {

      alert(

        "Select a material use."

      );

      return;

    }

    if (

      !selectedMaterialId

    ) {

      alert(

        "Select a material."

      );

      return;

    }

    const parsedQuantity =

      Number(

        quantity

      );

    if (

      !Number.isFinite(

        parsedQuantity

      ) ||

      parsedQuantity <= 0

    ) {

      alert(

        "Enter a valid quantity."

      );

      return;

    }

    const {

      error,

    } =

      await supabase

        .from(

          "product_recipe_items"

        )

        .upsert(

          {

            product_id:

              selectedProductId,

            material_id:

              selectedMaterialId,

            material_role:

              selectedRole,

            quantity_needed:

              parsedQuantity,

          },

          {

            onConflict:

              "product_id,material_id,material_role",

          }

        );

    if (error) {

      alert(

        error.message

      );

      return;

    }

    setSelectedRole("");

    setSelectedMaterialId(

      ""

    );

    setQuantity("");

    await loadProductData(

      selectedProductId

    );

  }

  async function removeRecipeItem(

    id: string

  ) {

    if (

      !window.confirm(

        "Remove this material from the product recipe?"

      )

    ) {

      return;

    }

    const {

      error,

    } =

      await supabase

        .from(

          "product_recipe_items"

        )

        .delete()

        .eq(

          "id",

          id

        );

    if (error) {

      alert(

        error.message

      );

      return;

    }

    await loadProductData(

      selectedProductId

    );

  }

  async function updateQuantity(

    id: string,

    value: number

  ) {

    if (

      value <= 0

    ) {

      alert(

        "Quantity must be greater than zero."

      );

      return;

    }

    const {

      error,

    } =

      await supabase

        .from(

          "product_recipe_items"

        )

        .update({

          quantity_needed:

            value,

        })

        .eq(

          "id",

          id

        );

    if (error) {

      alert(

        error.message

      );

      return;

    }

    await loadProductData(

      selectedProductId

    );

  }

  async function saveLaborCost() {

    if (

      !selectedProductId

    ) {

      return;

    }

    const value =

      Number(

        laborCost

      );

    if (

      !Number.isFinite(

        value

      ) ||

      value < 0

    ) {

      alert(

        "Enter a valid labor cost."

      );

      return;

    }

    setSavingLabor(true);

    const {

      error,

    } =

      await supabase

        .from("products")

        .update({

          labor_cost:

            value,

          updated_at:

            new Date()

              .toISOString(),

        })

        .eq(

          "id",

          selectedProductId

        );

    setSavingLabor(false);

    if (error) {

      alert(

        error.message

      );

      return;

    }

    setProducts(

      (

        currentProducts

      ) =>

        currentProducts.map(

          (product) =>

            product.id ===

            selectedProductId

              ? {

                  ...product,

                  labor_cost:

                    value,

                }

              : product

        )

    );

    alert(

      "Labor cost saved."

    );

  }

  async function saveCurrentCost() {

    if (

      !selectedProduct

    ) {

      return;

    }

    if (

      estimatedCost <= 0

    ) {

      alert(

        "Estimated production cost must be greater than zero."

      );

      return;

    }

    const {

      error,

    } =

      await supabase

        .from(

          "product_cost_history"

        )

        .upsert(

          {

            product_name:

              selectedProduct.name,

            cost:

              estimatedCost,

            effective_from:

              effectiveDate,

          },

          {

            onConflict:

              "product_name,effective_from",

          }

        );

    if (error) {

      alert(

        error.message

      );

      return;

    }

    await loadProductData(

      selectedProductId

    );

  }

  async function deleteHistory(

    id: string

  ) {

    if (

      !window.confirm(

        "Delete this historical cost?"

      )

    ) {

      return;

    }

    const {

      error,

    } =

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

        error.message

      );

      return;

    }

    await loadProductData(

      selectedProductId

    );

  }

  function addFabricCut() {

    setFabricCuts(

      (

        currentCuts

      ) => [

        ...currentCuts,

        {

          id:

            Date.now(),

          lengthCm: 0,

          widthCm: 0,

          quantity: 1,

        },

      ]

    );

  }

  function updateFabricCut(

    id: number,

    field:

      | "lengthCm"

      | "widthCm"

      | "quantity",

    value: number

  ) {

    setFabricCuts(

      (

        currentCuts

      ) =>

        currentCuts.map(

          (cut) =>

            cut.id === id

              ? {

                  ...cut,

                  [field]:

                    value,

                }

              : cut

        )

    );

  }

  function removeFabricCut(

    id: number

  ) {

    setFabricCuts(

      (

        currentCuts

      ) =>

        currentCuts.filter(

          (cut) =>

            cut.id !== id

        )

    );

  }

  if (

    loading

  ) {

    return (

      <main className="min-h-screen bg-white text-black">

        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">

        <p className="text-sm text-zinc-500">

          Loading Cost History...

        </p>

        </div>

      </main>

    );

  }

  return (

    <main className="min-h-screen bg-white text-black">

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">

      {/* HEADER */}

      <header className="border-b border-black pb-7">

        <p className="text-sm font-medium text-zinc-500">

          Imbentoree

        </p>

        <h1 className="mt-1 text-4xl font-bold tracking-tight text-black">

          Cost History

        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">

          Build, review and preserve the estimated production cost of each design.

        </p>

      </header>

      {/* PRODUCT SELECTOR */}

      <section className="border border-black bg-white p-5">

        <label className="block max-w-md">

          <span className="text-sm font-semibold text-black">

            Product

          </span>

          <select

            value={

              selectedProductId

            }

            onChange={(

              event

            ) =>

              setSelectedProductId(

                event.target

                  .value

              )

            }

            className="mt-2 w-full border border-black bg-white px-4 py-3 text-base text-black outline-none"

          >

            {products.map(

              (product) => (

                <option

                  key={

                    product.id

                  }

                  value={

                    product.id

                  }

                >

                  {

                    product.name

                  }

                </option>

              )

            )}

          </select>

        </label>

        {selectedProduct && (

          <div className="mt-5 flex flex-wrap gap-x-8 gap-y-2 border-t border-zinc-200 pt-4 text-sm text-zinc-600">

            <span>

              Selling price{" "}

              <strong className="font-bold text-black">

                {peso(

                  sellingPrice

                )}

              </strong>

            </span>

            <span>

              Estimated cost{" "}

              <strong className="font-bold text-black">

                {peso(

                  estimatedCost

                )}

              </strong>

            </span>

            <span>

              Margin{" "}

              <strong className="font-bold text-black">

                {grossMargin.toFixed(

                  1

                )}

                %

              </strong>

            </span>

          </div>

        )}

      </section>

      {/* Tabs */}

      <div className="mt-6 flex max-w-full gap-7 overflow-x-auto border-b border-black bg-white">

        <TabButton

          active={

            tab ===

            "costing"

          }

          onClick={() =>

            setTab(

              "costing"

            )

          }

        >

          <WalletCards

            size={15}

          />

          Costing

        </TabButton>

        <TabButton

          active={

            tab ===

            "calculator"

          }

          onClick={() =>

            setTab(

              "calculator"

            )

          }

        >

          <Calculator

            size={15}

          />

          Material Calculator

        </TabButton>

        <TabButton

          active={

            tab ===

            "labor"

          }

          onClick={() =>

            setTab(

              "labor"

            )

          }

        >

          <Clock3

            size={15}

          />

          Labor

        </TabButton>

        <TabButton

          active={

            tab ===

            "history"

          }

          onClick={() =>

            setTab(

              "history"

            )

          }

        >

          <History

            size={15}

          />

          Cost History

        </TabButton>

      </div>

      {/* COSTING */}

      {tab ===

        "costing" && (

        <div className="space-y-6">

          <section className="border border-black bg-white p-5 md:p-6">

            <h2 className="font-bold text-black">

              Add Material

            </h2>

            <p className="mt-1 text-sm text-zinc-500">

              Build the estimated recipe for one finished product.

            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-3">

              <Field

                label="Material Use"

              >

                <select

                  value={

                    selectedRole

                  }

                  onChange={(

                    event

                  ) => {

                    setSelectedRole(

                      event.target

                        .value

                    );

                    setSelectedMaterialId(

                      ""

                    );

                  }}

                  className="mt-2 w-full border border-black bg-white px-4 py-3 text-base text-black outline-none"

                >

                  <option value="">

                    Select use...

                  </option>

                  {MATERIAL_ROLE_OPTIONS.map(

                    (

                      option

                    ) => (

                      <option

                        key={

                          option.value

                        }

                        value={

                          option.value

                        }

                      >

                        {

                          option.label

                        }

                      </option>

                    )

                  )}

                </select>

              </Field>

              <Field

                label="Material"

              >

                <select

                  value={

                    selectedMaterialId

                  }

                  onChange={(

                    event

                  ) =>

                    setSelectedMaterialId(

                      event.target

                        .value

                    )

                  }

                  disabled={

                    !selectedRole

                  }

                  className="mt-2 w-full border border-black bg-white px-4 py-3 text-base text-black outline-none disabled:bg-zinc-100"

                >

                  <option value="">

                    Select material...

                  </option>

                  {availableMaterials.map(

                    (

                      material

                    ) => (

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

                        }

                      </option>

                    )

                  )}

                </select>

              </Field>

              <Field

                label="Quantity Needed"

              >

                <input

                  type="number"

                  min="0"

                  step="0.001"

                  value={

                    quantity

                  }

                  onChange={(

                    event

                  ) =>

                    setQuantity(

                      event.target

                        .value

                    )

                  }

                  placeholder="0.18"

                  className="mt-2 w-full border border-black bg-white px-4 py-3 text-base text-black outline-none"

                />

              </Field>

            </div>

            <button

              type="button"

              onClick={() =>

                void addRecipeItem()

              }

              className="mt-5 inline-flex min-h-11 items-center gap-2 border border-black bg-white px-5 text-sm font-semibold text-black hover:bg-zinc-50"

            >

              <Plus

                size={16}

              />

              Add Material

            </button>

          </section>

          <section className="overflow-hidden border border-black bg-white">

            <div className="border-b border-black px-5 py-4">

              <h2 className="font-bold text-black">

                Product Recipe

              </h2>

            </div>

            {recipe.length ===

            0 ? (

              <p className="p-6 text-sm text-zinc-500">

                No materials added to this product yet.

              </p>

            ) : (

              <div className="divide-y divide-zinc-200">

                {recipe.map(

                  (

                    item

                  ) => {

                    const material =

                      getMaterial(

                        item.material_id

                      );

                    const lineCost =

                      Number(

                        item.quantity_needed

                      ) *

                      Number(

                        material?.cost_per_unit ??

                          0

                      );

                    return (

                      <div

                        key={

                          item.id

                        }

                        className="grid gap-4 p-5 md:grid-cols-[1fr_150px_140px_auto] md:items-center"

                      >

                        <div>

                          <p className="font-semibold text-black">

                            {material?.name ??

                              "Missing Material"}

                          </p>

                          <p className="mt-1 text-sm text-zinc-500">

                            {roleLabel(

                              item.material_role

                            )}

                            {" · "}

                            {material?.unit ??

                              ""}

                            {material

                              ? ` · ${peso(Number(material.cost_per_unit))}/${material.unit}`

                              : ""}

                          </p>

                        </div>

                        <div>

                          <p className="text-xs text-zinc-500">

                            {material?.unit === "m²"

                              ? "Area Used (m²)"

                              : `Quantity (${material?.unit ?? "unit"})`}

                          </p>

                          <input

                            key={`${item.id}-${item.quantity_needed}`}

                            type="number"

                            min="0"

                            step="0.001"

                            defaultValue={

                              item.quantity_needed

                            }

                            onBlur={(

                              event

                            ) => {

                              const next =

                                Number(

                                  event

                                    .target

                                    .value

                                );

                              if (

                                next !==

                                Number(

                                  item.quantity_needed

                                )

                              ) {

                                void updateQuantity(

                                  item.id,

                                  next

                                );

                              }

                            }}

                            className="mt-1 w-full border border-black bg-white px-3 py-2 text-base text-black outline-none"

                          />

                        </div>

                        <div>

                          <p className="text-xs text-zinc-500">

                            Cost

                          </p>

                          <p className="mt-1 font-semibold text-black">

                            {peso(

                              lineCost

                            )}

                          </p>

                        </div>

                        <button

                          type="button"

                          onClick={() =>

                            void removeRecipeItem(

                              item.id

                            )

                          }

                          className="inline-flex min-h-10 items-center justify-center gap-2 border border-black bg-white px-3 text-sm font-medium text-black hover:bg-zinc-50"

                        >

                          <Trash2

                            size={15}

                          />

                          Remove

                        </button>

                      </div>

                    );

                  }

                )}

              </div>

            )}

          </section>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <SummaryCard

              label="Materials"

              value={

                materialCost

              }

            />

            <SummaryCard

              label="Labor"

              value={

                currentLaborCost

              }

            />

            <SummaryCard

              label="Estimated Cost"

              value={

                estimatedCost

              }

              emphasis

            />

            <SummaryCard

              label="Gross Profit"

              value={

                grossProfit

              }

            />

          </section>

          <section className="grid gap-4 sm:grid-cols-2">

            <PercentCard

              label="Gross Margin"

              value={

                grossMargin

              }

            />

            <PercentCard

              label="Markup"

              value={

                markup

              }

            />

          </section>

        </div>

      )}

      {/* MATERIAL CALCULATOR */}

      {tab ===

        "calculator" && (

        <div className="space-y-8">

          <div>

            <h2 className="text-2xl font-bold text-black">

              Material Calculator

            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">

              Calculate the quantity used in a product recipe. Material purchase

              units and supplier conversions are already normalized in Materials.

            </p>

          </div>

          {/* AREA MATERIALS */}

          <section className="border border-black bg-white p-5 md:p-6">

            <div className="border-b border-black pb-4">

              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">

                Area Materials

              </p>

              <h3 className="mt-1 text-xl font-bold text-black">

                Fabric Area Calculator

              </h3>

              <p className="mt-2 text-sm text-zinc-600">

                For materials whose standard costing unit is square meter,

                including fabric, foam and Pellon. Enter pattern pieces in centimeters.

              </p>

            </div>

            <div className="mt-6 space-y-3">

              {fabricCuts.map(

                (cut, index) => (

                  <div

                    key={cut.id}

                    className="grid gap-3 border border-black p-4 sm:grid-cols-[1fr_1fr_1fr_auto]"

                  >

                    <Field

                      label={`Piece ${index + 1} Length cm`}

                    >

                      <input

                        type="number"

                        min="0"

                        step="0.1"

                        value={cut.lengthCm || ""}

                        onChange={(event) =>

                          updateFabricCut(

                            cut.id,

                            "lengthCm",

                            Number(event.target.value)

                          )

                        }

                        className="mt-2 w-full border border-black bg-white px-3 py-2.5 text-base text-black outline-none"

                      />

                    </Field>

                    <Field label="Width cm">

                      <input

                        type="number"

                        min="0"

                        step="0.1"

                        value={cut.widthCm || ""}

                        onChange={(event) =>

                          updateFabricCut(

                            cut.id,

                            "widthCm",

                            Number(event.target.value)

                          )

                        }

                        className="mt-2 w-full border border-black bg-white px-3 py-2.5 text-base text-black outline-none"

                      />

                    </Field>

                    <Field label="Quantity">

                      <input

                        type="number"

                        min="1"

                        step="1"

                        value={cut.quantity}

                        onChange={(event) =>

                          updateFabricCut(

                            cut.id,

                            "quantity",

                            Number(event.target.value)

                          )

                        }

                        className="mt-2 w-full border border-black bg-white px-3 py-2.5 text-base text-black outline-none"

                      />

                    </Field>

                    <button

                      type="button"

                      onClick={() =>

                        removeFabricCut(cut.id)

                      }

                      disabled={fabricCuts.length === 1}

                      className="mt-auto min-h-11 border border-black bg-white px-3 text-sm font-medium text-black hover:bg-zinc-50 disabled:opacity-30"

                    >

                      Remove

                    </button>

                  </div>

                )

              )}

            </div>

            <button

              type="button"

              onClick={addFabricCut}

              className="mt-4 inline-flex min-h-11 items-center gap-2 border border-black bg-white px-4 text-sm font-semibold text-black hover:bg-zinc-50"

            >

              <Plus size={16} />

              Add Piece

            </button>

            <div className="mt-6 border-t border-black pt-5">

              <p className="text-sm font-medium text-zinc-500">

                Total Fabric Area

              </p>

              <p className="mt-2 text-4xl font-bold tracking-tight text-black">

                {totalFabricArea.toFixed(4)} m²

              </p>

              <p className="mt-3 text-sm text-zinc-500">

                Use this result as the recipe quantity for any material whose

                standard costing unit in Materials is m².

              </p>

            </div>

          </section>

          {/* LINEAR MATERIALS */}

          <section className="border border-black bg-white p-5 md:p-6">

            <div className="border-b border-black pb-4">

              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">

                Linear Materials

              </p>

              <h3 className="mt-1 text-xl font-bold text-black">

                Length & Cost Calculator

              </h3>

              <p className="mt-2 text-sm text-zinc-600">

                For materials whose normalized standard unit is meter or yard,

                such as webbing, paracord, grosgrain and zipper tape.

              </p>

            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">

              <Field label="Material">

                <select

                  value={linearMaterialId}

                  onChange={(event) =>

                    setLinearMaterialId(event.target.value)

                  }

                  className="mt-2 w-full border border-black bg-white px-4 py-3 text-base text-black outline-none"

                >

                  <option value="">Select material</option>

                  {linearMaterials.map((material) => (

                    <option

                      key={material.id}

                      value={material.id}

                    >

                      {material.name} · {peso(Number(material.cost_per_unit))}/{material.unit}

                    </option>

                  ))}

                </select>

              </Field>

              <Field label="Length Needed">

                <input

                  type="number"

                  min="0"

                  step="0.01"

                  value={linearLength}

                  onChange={(event) =>

                    setLinearLength(event.target.value)

                  }

                  placeholder="150"

                  className="mt-2 w-full border border-black bg-white px-4 py-3 text-base text-black outline-none"

                />

              </Field>

              <Field label="Input Unit">

                <select

                  value={linearInputUnit}

                  onChange={(event) =>

                    setLinearInputUnit(

                      event.target.value as

                        | "cm"

                        | "meter"

                        | "yard"

                    )

                  }

                  className="mt-2 w-full border border-black bg-white px-4 py-3 text-base text-black outline-none"

                >

                  <option value="cm">Centimeter</option>

                  <option value="meter">Meter</option>

                  <option value="yard">Yard</option>

                </select>

              </Field>

              <Field label="Quantity">

                <input

                  type="number"

                  min="1"

                  step="1"

                  value={linearQuantity}

                  onChange={(event) =>

                    setLinearQuantity(event.target.value)

                  }

                  className="mt-2 w-full border border-black bg-white px-4 py-3 text-base text-black outline-none"

                />

              </Field>

            </div>

            <div className="mt-6 grid gap-5 border-t border-black pt-5 sm:grid-cols-2 lg:grid-cols-4">

              <div>

                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">

                  Total Meters

                </p>

                <p className="mt-2 text-2xl font-bold text-black">

                  {linearLengthMeters.toFixed(3)} m

                </p>

              </div>

              <div>

                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">

                  Total Yards

                </p>

                <p className="mt-2 text-2xl font-bold text-black">

                  {linearLengthYards.toFixed(3)} yd

                </p>

              </div>

              <div>

                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">

                  Recipe Quantity

                </p>

                <p className="mt-2 text-2xl font-bold text-black">

                  {selectedLinearMaterial

                    ? `${linearMaterialQuantity.toFixed(3)} ${selectedLinearMaterial.unit}`

                    : "—"}

                </p>

              </div>

              <div>

                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">

                  Estimated Cost

                </p>

                <p className="mt-2 text-2xl font-bold text-black">

                  {selectedLinearMaterial

                    ? peso(linearEstimatedCost)

                    : "—"}

                </p>

              </div>

            </div>

            {selectedLinearMaterial && (

              <p className="mt-5 text-sm leading-6 text-zinc-600">

                {selectedLinearMaterial.name} costs {peso(

                  Number(selectedLinearMaterial.cost_per_unit)

                )} per {selectedLinearMaterial.unit}. Use {linearMaterialQuantity.toFixed(3)} as the quantity in the Costing recipe.

              </p>

            )}

          </section>

        </div>

      )}

      {/* LABOR */}

      {tab ===

        "labor" && (

        <div className="space-y-6">

          <section

            className="border border-black bg-white p-6 md:p-8"

          >

            <div className="max-w-2xl">

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center border border-black bg-white text-black">

                  <Clock3

                    size={20}

                  />

                </div>

                <div>

                  <p className="text-sm font-medium text-zinc-500">

                    Labor

                  </p>

                  <h2 className="text-xl font-bold text-black">

                    Your work is part of the product cost.

                  </h2>

                </div>

              </div>

              <p className="mt-5 text-sm leading-6 text-zinc-600">

                Materials are only one part of making a bag. Set the

                labor cost you want included for every unit of{" "}

                <strong>

                  {selectedProduct?.name}

                </strong>

                .

              </p>

              <div className="mt-7">

                <label className="block">

                  <span className="text-sm font-semibold text-black">

                    Labor Cost per Unit

                  </span>

                  <div className="relative mt-2 max-w-md">

                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-semibold text-zinc-400">

                      ₱

                    </span>

                    <input

                      type="number"

                      min="0"

                      step="0.01"

                      value={

                        laborCost

                      }

                      onChange={(

                        event

                      ) =>

                        setLaborCost(

                          event.target

                            .value

                        )

                      }

                      className="w-full border border-black bg-white py-5 pl-11 pr-4 text-3xl font-bold tracking-tight text-black outline-none"

                    />

                  </div>

                </label>

                <button

                  type="button"

                  onClick={() =>

                    void saveLaborCost()

                  }

                  disabled={

                    savingLabor

                  }

                  className="mt-4 inline-flex min-h-11 items-center gap-2 border border-black bg-white px-5 text-sm font-semibold text-black hover:bg-zinc-50 disabled:opacity-50"

                >

                  <Save

                    size={16}

                  />

                  {savingLabor

                    ? "Saving..."

                    : "Save Labor Cost"}

                </button>

              </div>

              {currentLaborCost >

              0 ? (

                <div className="mt-6 border-t border-black pt-4 text-sm font-semibold text-black">

                  Labor is included in the estimated production cost.

                </div>

              ) : (

                <div className="mt-6 border-t border-black pt-4 text-sm font-semibold text-black">

                  Labor is currently ₱0. Your estimated production

                  cost does not yet include the value of your work.

                </div>

              )}

            </div>

          </section>

          <section className="grid gap-4 sm:grid-cols-3">

            <SummaryCard

              label="Materials"

              value={

                materialCost

              }

            />

            <SummaryCard

              label="Labor"

              value={

                currentLaborCost

              }

              emphasis

            />

            <SummaryCard

              label="Estimated Cost"

              value={

                estimatedCost

              }

            />

          </section>

        </div>

      )}

      {/* COST HISTORY */}

      {tab ===

        "history" && (

        <div className="space-y-6">

          <section className="border border-black bg-white p-5 md:p-6">

            <div className="grid gap-6 md:grid-cols-[1fr_320px] md:items-end">

              <div>

                <p className="text-sm font-medium text-zinc-500">

                  Current Estimated Production Cost

                </p>

                <p className="mt-2 text-4xl font-bold tracking-tight text-black">

                  {peso(

                    estimatedCost

                  )}

                </p>

                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-500">

                  <span>

                    Materials{" "}

                    <strong className="text-zinc-800">

                      {peso(

                        materialCost

                      )}

                    </strong>

                  </span>

                  <span>

                    Labor{" "}

                    <strong className="text-zinc-800">

                      {peso(

                        currentLaborCost

                      )}

                    </strong>

                  </span>

                </div>

              </div>

              <div>

                <Field

                  label="Effective Date"

                >

                  <input

                    type="date"

                    value={

                      effectiveDate

                    }

                    onChange={(

                      event

                    ) =>

                      setEffectiveDate(

                        event.target

                          .value

                      )

                    }

                    className="mt-2 w-full border border-black bg-white px-4 py-3 text-base text-black outline-none"

                  />

                </Field>

                <button

                  type="button"

                  onClick={() =>

                    void saveCurrentCost()

                  }

                  className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 border border-black bg-white px-5 text-sm font-semibold text-black hover:bg-zinc-50"

                >

                  <Save

                    size={16}

                  />

                  Save Current Cost

                </button>

              </div>

            </div>

          </section>

          <section className="overflow-hidden border border-black bg-white">

            <div className="border-b border-black px-5 py-4">

              <h2 className="font-bold text-black">

                Cost History

              </h2>

              <p className="mt-1 text-sm text-zinc-500">

                Saved standard costs can later be used by Finance to

                estimate historical COGS.

              </p>

            </div>

            {history.length ===

            0 ? (

              <p className="p-6 text-sm text-zinc-500">

                No historical costs saved for this product.

              </p>

            ) : (

              <div className="divide-y divide-zinc-200">

                {history.map(

                  (

                    row

                  ) => (

                    <div

                      key={

                        row.id

                      }

                      className="flex items-center justify-between gap-4 px-5 py-4"

                    >

                      <div>

                        <p className="font-bold text-black">

                          {peso(

                            Number(

                              row.cost

                            )

                          )}

                        </p>

                        <p className="mt-1 text-sm text-zinc-500">

                          Effective{" "}

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

                        </p>

                      </div>

                      <button

                        type="button"

                        onClick={() =>

                          void deleteHistory(

                            row.id

                          )

                        }

                        className="border border-black bg-white p-2 text-black hover:bg-zinc-50"

                      >

                        <Trash2

                          size={17}

                        />

                      </button>

                    </div>

                  )

                )}

              </div>

            )}

          </section>

        </div>

      )}

      </div>

    </main>

  );

}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex shrink-0 items-center gap-2 border-b-2 px-1 py-3 text-sm font-semibold ${
        active
          ? "border-black text-black"
          : "border-transparent text-zinc-500 hover:text-black"
      }`}
    >
      {children}
    </button>
  );
}

function Field({

  label,

  children,

}: {

  label: string;

  children:

    React.ReactNode;

}) {

  return (

    <label className="block">

      <span className="text-sm font-semibold text-black">

        {label}

      </span>

      {children}

    </label>

  );

}

function SummaryCard({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: number;
  emphasis?: boolean;
}) {
  return (
    <div
      className={`border bg-white p-5 text-black ${
        emphasis ? "border-black" : "border-zinc-300"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold tracking-tight text-black">
        {peso(value)}
      </p>
    </div>
  );
}

function PercentCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="border border-zinc-300 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold tracking-tight text-black">
        {value.toFixed(1)}%
      </p>
    </div>
  );
}