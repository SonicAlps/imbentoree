"use client";

import { useState, useEffect } from "react";
import { toPng } from "html-to-image";
import OrderPreview from "./order-preview";
import { supabase } from "@/src/lib/supabase";
import { toCamelCaseName } from "@/src/lib/format";
import { products, type ProductName } from "@/src/lib/products";

async function generateOrderNumber(): Promise<string> {
  const { data, error } = await supabase.rpc("generate_order_number");

  if (error) {
    console.error("Failed to generate order number:", error.message);
    return `IMB-ERROR-${Date.now()}`; // fallback so the app doesn't crash
  }

  return data as string;
}


type Material = {
  id: string;
  name: string;
  unit: string;
  cost_per_unit: number;
  material_roles: string[];
};

type ExistingOrder = {
  id: string;
  order_number: string;
  customer_name: string;
  email: string;
  product: ProductName;
  outer_fabric: string;
  inner_fabric: string;
  strap_size: string | null;
  strap_color: string | null;
  mounting_type: string | null;
  status: string;
  price: number;
  target_completion_date: string | null;
  tracking_token: string | null;
  created_at: string;
};

type OrderFormProps = {
  mode?: "create" | "edit";
  initialOrder?: ExistingOrder;
};

export default function OrderForm({
  mode = "create",
  initialOrder,
}: OrderFormProps) {
  // ---- ALL STATE + FUNCTIONS LIVE HERE, INSIDE THE COMPONENT ----

  const [orderNumber, setOrderNumber] = useState(
  initialOrder?.order_number ?? ""
);

const [customerName, setCustomerName] = useState(
  initialOrder?.customer_name ?? ""
);

const [email, setEmail] = useState(
  initialOrder?.email ?? ""
);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(true);
  const [requiredRoles, setRequiredRoles] = useState<string[]>([]);
  const [bomLoading, setBomLoading] = useState(true);

 const [product, setProduct] = useState<ProductName>(
  initialOrder?.product ?? "Small Sling"
);

const [outerFabric, setOuterFabric] = useState(
  initialOrder?.outer_fabric ?? "Army Green"
);

const [innerFabric, setInnerFabric] = useState(
  initialOrder?.inner_fabric ?? "Orange"
);

const [strapColor, setStrapColor] = useState(
  initialOrder?.strap_color ?? "Army Green"
);

const [mountingType, setMountingType] = useState(
  initialOrder?.mounting_type ?? "Sling Hook"
);

const [price, setPrice] = useState<number>(
  initialOrder?.price ?? 0
);

const [targetCompletionDate, setTargetCompletionDate] =
  useState(
    initialOrder?.target_completion_date ?? ""
  );

const [trackingToken, setTrackingToken] = useState(
  initialOrder?.tracking_token ?? ""
);

  const selectedProduct = products[product];
  const [isConfirmed, setIsConfirmed] = useState(false);



  useEffect(() => {
    async function fetchMaterials() {
      setMaterialsLoading(true);

      const { data, error } = await supabase
        .from("materials")
        .select(
          "id, name, unit, cost_per_unit, material_roles"
        )
        .order("name");

      if (error) {
        console.error(
          "Failed to load order materials:",
          error.message
        );
        setMaterials([]);
      } else {
        setMaterials(
          (data as Material[]) || []
        );
      }

      setMaterialsLoading(false);
    }

    fetchMaterials();
  }, []);

  const outerFabricMaterials =
    materials.filter((material) =>
      material.material_roles?.includes(
        "outer_fabric"
      )
    );

  const innerFabricMaterials =
    materials.filter((material) =>
      material.material_roles?.includes(
        "inner_fabric"
      )
    );

  const strapMaterials =
    materials.filter((material) =>
      material.material_roles?.includes(
        "strap"
      )
    );

  const hardwareMaterials =
    materials.filter((material) =>
      material.material_roles?.includes(
        "hardware"
      )
    );

  const requiresRole = (role: string) =>
    requiredRoles.includes(role);

  useEffect(() => {
    async function fetchRequiredRoles() {
      setBomLoading(true);

      const { data: bagType, error: bagTypeError } =
        await supabase
          .from("bag_types")
          .select("id")
          .eq("name", product)
          .maybeSingle();

      if (bagTypeError || !bagType) {
        console.error(
          "Could not find bag type for product:",
          product,
          bagTypeError?.message
        );
        setRequiredRoles([]);
        setBomLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("bag_type_materials")
        .select("material_role")
        .eq("bag_type_id", bagType.id);

      if (error) {
        console.error(
          "Failed to load product material roles:",
          error.message
        );
        setRequiredRoles([]);
      } else {
        const roles = Array.from(
          new Set(
            (data || [])
              .map((row) => row.material_role)
              .filter(
                (role): role is string =>
                  Boolean(role)
              )
          )
        );

        setRequiredRoles(roles);
      }

      setBomLoading(false);
    }

    fetchRequiredRoles();
  }, [product]);

  // Auto-reset material defaults when switching products.
  // Product Costs / BOM decides which roles are required.
  // Materials supplies the exact physical item for each role.
  useEffect(() => {
    if (
      initialOrder &&
      product === initialOrder.product
    ) {
      return;
    }

    setOuterFabric(
      requiresRole("outer_fabric")
        ? outerFabricMaterials[0]?.name || ""
        : ""
    );

    setInnerFabric(
      requiresRole("inner_fabric")
        ? innerFabricMaterials[0]?.name || ""
        : ""
    );

    setStrapColor(
      requiresRole("strap")
        ? strapMaterials[0]?.name || ""
        : ""
    );

    setMountingType(
      requiresRole("hardware")
        ? hardwareMaterials[0]?.name || ""
        : ""
    );

    setPrice(selectedProduct.basePrice);
  }, [
    product,
    initialOrder,
    selectedProduct,
    materials,
    requiredRoles,
  ]);

  async function generateOrderImage(currentOrderNumber: string) {
    const element = document.getElementById("order-preview");

    if (!element) return;

    try {
      const dataUrl = await toPng(element, {
        pixelRatio: 3, // High DPI for crisp text inside the exported image
      });

      const link = document.createElement("a");
      const fileName = `${currentOrderNumber}-${toCamelCaseName(customerName)}.png`;

      link.download = fileName;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Failed to generate order image:", error);
    }
  }

async function submitOrder() {
  if (!customerName || !email) {
    alert("Please fill in customer name and email.");
    return;
  }

  if (
    requiresRole("outer_fabric") &&
    !outerFabric
  ) {
    alert("Please select an outer fabric.");
    return;
  }

  if (
    requiresRole("inner_fabric") &&
    !innerFabric
  ) {
    alert("Please select an inner fabric.");
    return;
  }

  if (
    requiresRole("strap") &&
    !strapColor
  ) {
    alert("Please select a strap material.");
    return;
  }

  if (
    requiresRole("hardware") &&
    !mountingType
  ) {
    alert("Please select hardware.");
    return;
  }

  setIsSubmitting(true);

  try {
    // CREATE MODE
   

    if (mode === "create") {
      const newOrderNumber = await generateOrderNumber();

      setOrderNumber(newOrderNumber);

      const {
        data: createdOrder,
        error,
      } = await supabase
        .from("orders")
        .insert([
          {
            order_number: newOrderNumber,
            customer_name: customerName,
            email,
            product,
            outer_fabric: outerFabric,
            inner_fabric: innerFabric,

            // Legacy DB columns are kept for compatibility.
            // Strap identity now lives in the selected Material name.
            strap_size: null,
            strap_color:
              requiresRole("strap")
                ? strapColor
                : null,
            mounting_type:
              requiresRole("hardware")
                ? mountingType
                : null,

            target_completion_date:
              targetCompletionDate || null,
            price,
          },
        ])
        .select("tracking_token")
        .single();

      if (error) {
        console.error("Order save failed:", error.message);
        alert(`Could not save order: ${error.message}`);
        return;
      }

      const newTrackingToken =
        createdOrder?.tracking_token ?? "";

      setTrackingToken(newTrackingToken);

      // Allow React to render the order number + QR before image export.
      await new Promise((resolve) =>
        setTimeout(resolve, 100)
      );

      await generateOrderImage(newOrderNumber);

      setIsConfirmed(true);

      return;
    }

    // ============================================================
    // EDIT MODE
    // ============================================================

    if (mode === "edit" && initialOrder) {
      const { error } = await supabase
        .from("orders")
        .update({
          customer_name: customerName,
          email,
          product,
          outer_fabric: outerFabric,
          inner_fabric: innerFabric,
          // Legacy DB columns are kept for compatibility.
          // Strap size/type now lives in the selected Material name.
          strap_size: null,
          strap_color:
            requiresRole("strap")
              ? strapColor
              : null,
          mounting_type:
            requiresRole("hardware")
              ? mountingType
              : null,
          target_completion_date:
            targetCompletionDate || null,
          price,
        })
        .eq("id", initialOrder.id);

      if (error) {
        console.error("Order update failed:", error.message);
        alert(`Could not update order: ${error.message}`);
        return;
      }

      // IMPORTANT:
      // Editing NEVER generates a new order number.
      await generateOrderImage(initialOrder.order_number);

      window.location.href = `/orders/${initialOrder.order_number}`;

      return;
    }

    console.error("Invalid OrderForm mode or missing initial order.");

  } catch (error) {
    console.error("Unexpected order submission error:", error);

    alert("Something went wrong while saving the order.");
  } finally {
    setIsSubmitting(false);
  }
}



function startNewOrder() {
  setCustomerName("");
  setEmail("");
  setProduct("Small Sling");
  setOrderNumber("");

  setOuterFabric("");
  setInnerFabric("");
  setStrapColor("");
  setMountingType("");
  setTargetCompletionDate("");
  setTrackingToken("");
  setPrice(products["Small Sling"].basePrice);

  setIsConfirmed(false);
}




  // ---- BELOW THIS POINT: JSX ONLY ----

  

  return isConfirmed ? (
    // ---- CONFIRMATION VIEW (shown after a successful submit) ----
    <div className="mx-auto max-w-md rounded-xl border bg-white p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
        <span className="text-2xl">✓</span>
      </div>
      <h2 className="text-xl font-semibold">Order Confirmed!</h2>
      <p className="mt-2 text-sm text-zinc-500">
        Order <span className="font-mono font-medium">{orderNumber}</span> has
        been saved and the image was downloaded.
      </p>
      <button
        type="button"
        onClick={startNewOrder}
        className="mt-6 w-full rounded-lg bg-black px-5 py-3 font-medium text-white hover:bg-zinc-800 transition-colors"
      >
        Start New Order
      </button>
    </div>
  ) : (
    // ---- FORM VIEW (default) ----
    <div className="grid gap-8 lg:grid-cols-2">
      {/* LEFT SIDE — ORDER FORM */}
      <div className="rounded-xl border bg-white p-8 shadow-sm">
        <div>
          <h2 className="text-xl font-semibold text-zinc-800">Configure Your Order</h2>
          <p className="mt-1 text-sm text-zinc-800">
            Select the product and customize its options.
          </p>
        </div>

        {/* CUSTOMER NAME */}
        <div className="mt-8">
          <label className="text-sm font-medium text-zinc-800">Customer Name</label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="mt-2 w-full rounded-lg border px-4 py-3 text-zinc-800"
            placeholder="Juan Dela Cruz"
          />
        </div>

        {/* EMAIL */}
        <div className="mt-6">
          <label className="text-sm font-medium text-zinc-800" >Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-lg border px-4 py-3 text-zinc-800"
            placeholder="imbentobags@gmail.com"
          />
        </div>

        {/* PRODUCT */}
        <div className="mt-8">
          <label className="text-sm font-medium text-zinc-800">Product</label>
          <select
            value={product}
            onChange={(e) => setProduct(e.target.value as ProductName)}
            className="mt-2 w-full rounded-lg border px-4 py-3 text-zinc-800" 
          >
            {Object.keys(products).map((productName) => (
              <option key={productName} value={productName}>
                {productName}
              </option>
            ))}
          </select>
        </div>

        {bomLoading && (
          <p className="mt-6 text-sm text-zinc-500">
            Loading product material requirements...
          </p>
        )}

        {!bomLoading && requiredRoles.length === 0 && (
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            No material roles are configured for this product yet.
            Add its recipe in Product Costs first.
          </div>
        )}

        {/* OUTER FABRIC */}
        {requiresRole("outer_fabric") && (
        <div className="mt-6">
          <label className="text-sm font-medium text-zinc-800">
            Outer Fabric
          </label>

          <select
            value={outerFabric}
            disabled={
              materialsLoading ||
              outerFabricMaterials.length === 0
            }
            onChange={(e) =>
              setOuterFabric(e.target.value)
            }
            className="mt-2 w-full rounded-lg border px-4 py-3 text-zinc-800 disabled:bg-zinc-100 disabled:text-zinc-400"
          >
            {materialsLoading ? (
              <option value="">
                Loading materials...
              </option>
            ) : outerFabricMaterials.length === 0 ? (
              <option value="">
                No outer fabrics configured
              </option>
            ) : (
              <>
                {initialOrder?.outer_fabric &&
                  !outerFabricMaterials.some(
                    (material) =>
                      material.name ===
                      initialOrder.outer_fabric
                  ) && (
                    <option
                      value={
                        initialOrder.outer_fabric
                      }
                    >
                      {initialOrder.outer_fabric}
                      {" (saved)"}
                    </option>
                  )}

                {outerFabricMaterials.map(
                  (material) => (
                    <option
                      key={material.id}
                      value={material.name}
                    >
                      {material.name}
                    </option>
                  )
                )}
              </>
            )}
          </select>
        </div>

        )}

        {/* INNER FABRIC */}
        {requiresRole("inner_fabric") && (
        <div className="mt-6">
          <label className="text-sm font-medium text-zinc-800">
            Inner Fabric
          </label>

          <select
            value={innerFabric}
            disabled={
              materialsLoading ||
              innerFabricMaterials.length === 0
            }
            onChange={(e) =>
              setInnerFabric(e.target.value)
            }
            className="mt-2 w-full rounded-lg border px-4 py-3 text-zinc-800 disabled:bg-zinc-100 disabled:text-zinc-400"
          >
            {materialsLoading ? (
              <option value="">
                Loading materials...
              </option>
            ) : innerFabricMaterials.length === 0 ? (
              <option value="">
                No inner fabrics configured
              </option>
            ) : (
              <>
                {initialOrder?.inner_fabric &&
                  !innerFabricMaterials.some(
                    (material) =>
                      material.name ===
                      initialOrder.inner_fabric
                  ) && (
                    <option
                      value={
                        initialOrder.inner_fabric
                      }
                    >
                      {initialOrder.inner_fabric}
                      {" (saved)"}
                    </option>
                  )}

                {innerFabricMaterials.map(
                  (material) => (
                    <option
                      key={material.id}
                      value={material.name}
                    >
                      {material.name}
                    </option>
                  )
                )}
              </>
            )}
          </select>
        </div>

        )}

        {/* STRAP MATERIAL */}
        {requiresRole("strap") && (
          <div className="mt-6">
            <label className="text-sm font-medium text-zinc-800">
              Strap Material
            </label>

            <select
              value={strapColor}
              disabled={
                materialsLoading ||
                strapMaterials.length === 0
              }
              onChange={(e) =>
                setStrapColor(e.target.value)
              }
              className="mt-2 w-full rounded-lg border px-4 py-3 text-zinc-800 disabled:bg-zinc-100 disabled:text-zinc-400"
            >
              {materialsLoading ? (
                <option value="">
                  Loading materials...
                </option>
              ) : strapMaterials.length === 0 ? (
                <option value="">
                  No strap materials configured
                </option>
              ) : (
                <>
                  {initialOrder?.strap_color &&
                    !strapMaterials.some(
                      (material) =>
                        material.name ===
                        initialOrder.strap_color
                    ) && (
                      <option
                        value={
                          initialOrder.strap_color
                        }
                      >
                        {initialOrder.strap_color}
                        {" (saved)"}
                      </option>
                    )}

                  {strapMaterials.map(
                    (material) => (
                      <option
                        key={material.id}
                        value={material.name}
                      >
                        {material.name}
                      </option>
                    )
                  )}
                </>
              )}
            </select>
          </div>
        )}

        {/* HARDWARE */}
        {requiresRole("hardware") && (
          <div className="mt-6">
            <label className="text-sm font-medium text-zinc-800">
              Hardware
            </label>

            <select
              value={mountingType}
              disabled={
                materialsLoading ||
                hardwareMaterials.length === 0
              }
              onChange={(e) =>
                setMountingType(e.target.value)
              }
              className="mt-2 w-full rounded-lg border px-4 py-3 text-zinc-800 disabled:bg-zinc-100 disabled:text-zinc-400"
            >
              {materialsLoading ? (
                <option value="">
                  Loading materials...
                </option>
              ) : hardwareMaterials.length === 0 ? (
                <option value="">
                  No hardware configured
                </option>
              ) : (
                <>
                  {initialOrder?.mounting_type &&
                    !hardwareMaterials.some(
                      (material) =>
                        material.name ===
                        initialOrder.mounting_type
                    ) && (
                      <option
                        value={
                          initialOrder.mounting_type
                        }
                      >
                        {initialOrder.mounting_type}
                        {" (saved)"}
                      </option>
                    )}

                  {hardwareMaterials.map(
                    (material) => (
                      <option
                        key={material.id}
                        value={material.name}
                      >
                        {material.name}
                      </option>
                    )
                  )}
                </>
              )}
            </select>
          </div>
        )}

        {/* TARGET COMPLETION */}
        <div className="mt-6">
          <label className="text-sm font-medium text-zinc-800">
            Target Completion
          </label>

          <input
            type="date"
            value={targetCompletionDate}
            onChange={(e) =>
              setTargetCompletionDate(e.target.value)
            }
            className="mt-2 w-full rounded-lg border px-4 py-3 text-zinc-800"
          />
        </div>

        {/* PRICE */}
        <div className="mt-6">
          <label className="text-sm font-medium text-zinc-800">Price (₱)</label>
          <div className="mt-2 w-full rounded-lg border bg-zinc-50 px-4 py-3 text-zinc-700">
            ₱{price.toFixed(2)}
            </div>
          
        </div>
      </div>

      {/* RIGHT SIDE — ORDER PREVIEW */}
      <div className="rounded-xl border bg-zinc-100 p-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-zinc-800">Order Preview</h2>
          <p className="mt-1 text-sm text-zinc-500">
  {mode === "edit"
    ? "Review your changes before saving."
    : "Photo will be generated after order confirmation."}
</p>
        </div>

        <OrderPreview
          orderNumber={orderNumber}
          customerName={customerName}
          product={product}
          outerFabric={outerFabric}
          innerFabric={innerFabric}
          strapMaterial={
            requiresRole("strap")
              ? strapColor
              : ""
          }
          hardware={
            requiresRole("hardware")
              ? mountingType
              : ""
          }
          targetCompletionDate={
            targetCompletionDate
          }
          trackingToken={
            trackingToken || undefined
          }
          price={price}
        />

        <button
          type="button"
          onClick={submitOrder}
          disabled={isSubmitting}
          className="mt-6 w-full rounded-lg bg-black px-5 py-3 font-medium text-white hover:bg-zinc-800 transition-colors disabled:opacity-50"
        >
          {isSubmitting
  ? "Saving..."
  : mode === "edit"
  ? "Save Changes"
  : "Confirm Order"}
        </button>
      </div>
    </div>
  );
}
