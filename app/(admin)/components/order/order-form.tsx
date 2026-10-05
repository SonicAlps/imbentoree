"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import OrderPreview from "./order-preview";
import { supabase } from "@/src/lib/supabase";
import { toCamelCaseName } from "@/src/lib/format";
import { v4 as uuidv4 } from "uuid";

async function generateOrderNumber(): Promise<string> {
  const { data, error } = await supabase.rpc("generate_order_number");

  if (error) {
    console.error("Failed to generate order number:", error.message);
    return `IMB-ERROR-${Date.now()}`;
  }

  return data as string;
}

type ExistingOrder = {
  id: string;
  order_number: string;
  customer_name: string;
  email: string;
  product: string;
  outer_fabric: string;
  inner_fabric: string;
  strap_size: string | null;
  strap_color: string | null;
  mounting_type: string | null;
  status: string;
  price: number;
  target_completion_date: string | null;
  tracking_token: string;
  created_at: string;
};

type ProductRecord = {
  id: string;
  name: string;
  base_price: number;
  active: boolean;
  outer_fabric_options: string[] | null;
  inner_fabric_options: string[] | null;
  strap_type_options: string[] | null;
  strap_color_options: string[] | null;
  mounting_type_options: string[] | null;
};

type OrderFormProps = {
  mode?: "create" | "edit";
  initialOrder?: ExistingOrder;
};

function normalizeOptions(values: string[] | null | undefined) {
  return (values ?? []).map((value) => value.trim()).filter(Boolean);
}

function optionsWithCurrent(values: string[], currentValue: string) {
  const cleanCurrent = currentValue.trim();

  if (!cleanCurrent) {
    return values;
  }

  const exists = values.some(
    (value) => value.toLowerCase() === cleanCurrent.toLowerCase()
  );

  return exists ? values : [cleanCurrent, ...values];
}

export default function OrderForm({
  mode = "create",
  initialOrder,
}: OrderFormProps) {
  const [orderNumber, setOrderNumber] = useState(
    initialOrder?.order_number ?? ""
  );

  const [customerName, setCustomerName] = useState(
    initialOrder?.customer_name ?? ""
  );

  const [email, setEmail] = useState(initialOrder?.email ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");

  const [product, setProduct] = useState(initialOrder?.product ?? "");
  const [outerFabric, setOuterFabric] = useState(
    initialOrder?.outer_fabric ?? ""
  );
  const [innerFabric, setInnerFabric] = useState(
    initialOrder?.inner_fabric ?? ""
  );
  const [strapSize, setStrapSize] = useState(
    initialOrder?.strap_size ?? ""
  );
  const [strapColor, setStrapColor] = useState(
    initialOrder?.strap_color ?? ""
  );
  const [mountingType, setMountingType] = useState(
    initialOrder?.mounting_type ?? ""
  );
  const [price, setPrice] = useState<number>(initialOrder?.price ?? 0);
  const [targetCompletionDate, setTargetCompletionDate] = useState(
    initialOrder?.target_completion_date ?? ""
  );
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [trackingToken, setTrackingToken] = useState(
    initialOrder?.tracking_token ?? ""
  );

  const editInitialConfigurationPreserved = useRef(false);

  useEffect(() => {
    void loadProducts();
  }, []);

  async function loadProducts() {
    setProductsLoading(true);
    setProductsError("");

    const { data, error } = await supabase
      .from("products")
      .select(`
        id,
        name,
        base_price,
        active,
        outer_fabric_options,
        inner_fabric_options,
        strap_type_options,
        strap_color_options,
        mounting_type_options
      `)
      .order("name", { ascending: true });

    if (error) {
      console.error("Failed to load products:", error.message);
      setProductsError(error.message);
      setProductsLoading(false);
      return;
    }

    const loadedProducts = (data ?? []) as ProductRecord[];
    setProducts(loadedProducts);

    if (mode === "create") {
      const activeProducts = loadedProducts.filter((item) => item.active);
      const preferredDefault =
        activeProducts.find((item) => item.name === "Small Sling") ??
        activeProducts[0];

      if (preferredDefault) {
        setProduct((current) => current || preferredDefault.name);
      }
    }

    setProductsLoading(false);
  }

  const availableProducts = useMemo(() => {
    if (mode === "create") {
      return products.filter((item) => item.active);
    }

    return products.filter(
      (item) => item.active || item.name === initialOrder?.product
    );
  }, [products, mode, initialOrder?.product]);

  const selectedProduct = useMemo(() => {
    const databaseProduct =
      products.find((item) => item.name === product) ?? null;

    if (databaseProduct) {
      return databaseProduct;
    }

    if (
      mode === "edit" &&
      initialOrder &&
      product === initialOrder.product
    ) {
      return {
        id: `legacy-${initialOrder.id}`,
        name: initialOrder.product,
        base_price: Number(initialOrder.price) || 0,
        active: false,
        outer_fabric_options: initialOrder.outer_fabric
          ? [initialOrder.outer_fabric]
          : [],
        inner_fabric_options: initialOrder.inner_fabric
          ? [initialOrder.inner_fabric]
          : [],
        strap_type_options: initialOrder.strap_size
          ? [initialOrder.strap_size]
          : [],
        strap_color_options: initialOrder.strap_color
          ? [initialOrder.strap_color]
          : [],
        mounting_type_options: initialOrder.mounting_type
          ? [initialOrder.mounting_type]
          : [],
      } satisfies ProductRecord;
    }

    return null;
  }, [products, product, mode, initialOrder]);

  const outerFabricOptions = useMemo(
    () =>
      optionsWithCurrent(
        normalizeOptions(selectedProduct?.outer_fabric_options),
        outerFabric
      ),
    [selectedProduct, outerFabric]
  );

  const innerFabricOptions = useMemo(
    () =>
      optionsWithCurrent(
        normalizeOptions(selectedProduct?.inner_fabric_options),
        innerFabric
      ),
    [selectedProduct, innerFabric]
  );

  const strapTypeOptions = useMemo(
    () =>
      optionsWithCurrent(
        normalizeOptions(selectedProduct?.strap_type_options),
        strapSize
      ),
    [selectedProduct, strapSize]
  );

  const strapColorOptions = useMemo(
    () =>
      optionsWithCurrent(
        normalizeOptions(selectedProduct?.strap_color_options),
        strapColor
      ),
    [selectedProduct, strapColor]
  );

  const mountingTypeOptions = useMemo(
    () =>
      optionsWithCurrent(
        normalizeOptions(selectedProduct?.mounting_type_options),
        mountingType
      ),
    [selectedProduct, mountingType]
  );

  useEffect(() => {
    if (!selectedProduct) {
      return;
    }

    if (
      mode === "edit" &&
      initialOrder &&
      !editInitialConfigurationPreserved.current
    ) {
      editInitialConfigurationPreserved.current = true;
      return;
    }

    setOuterFabric(
      normalizeOptions(selectedProduct.outer_fabric_options)[0] ?? ""
    );
    setInnerFabric(
      normalizeOptions(selectedProduct.inner_fabric_options)[0] ?? ""
    );
    setStrapSize(
      normalizeOptions(selectedProduct.strap_type_options)[0] ?? ""
    );
    setStrapColor(
      normalizeOptions(selectedProduct.strap_color_options)[0] ?? ""
    );
    setMountingType(
      normalizeOptions(selectedProduct.mounting_type_options)[0] ?? ""
    );
    setPrice(Number(selectedProduct.base_price) || 0);
  }, [selectedProduct?.id, mode, initialOrder]);

  async function generateOrderImage(currentOrderNumber: string) {
    const element = document.getElementById("order-preview");

    if (!element) return;

    try {
      const dataUrl = await toPng(element, {
        pixelRatio: 3,
      });

      const link = document.createElement("a");
      const fileName = `${currentOrderNumber}-${toCamelCaseName(
        customerName
      )}.png`;

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

    if (!targetCompletionDate) {
      alert("Please set a target completion date.");
      return;
    }

    if (!selectedProduct) {
      alert("Please select a valid product.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === "create") {
        const newOrderNumber = await generateOrderNumber();
        const newTrackingToken = uuidv4();

        setOrderNumber(newOrderNumber);
        setTrackingToken(newTrackingToken);

        const { error } = await supabase.from("orders").insert([
          {
            order_number: newOrderNumber,
            customer_name: customerName,
            email,
            product,
            outer_fabric: outerFabric,
            inner_fabric: innerFabric,
            strap_size:
              normalizeOptions(selectedProduct.strap_type_options).length > 0
                ? strapSize
                : null,
            strap_color:
              normalizeOptions(selectedProduct.strap_color_options).length > 0
                ? strapColor
                : null,
            mounting_type:
              normalizeOptions(selectedProduct.mounting_type_options).length > 0
                ? mountingType
                : null,
            price,
            target_completion_date: targetCompletionDate,
            tracking_token: newTrackingToken,
          },
        ]);

        if (error) {
          console.error("Order save failed:", error.message);
          alert(`Could not save order: ${error.message}`);
          return;
        }

        await generateOrderImage(newOrderNumber);
        setIsConfirmed(true);
        return;
      }

      if (mode === "edit" && initialOrder) {
        const { error } = await supabase
          .from("orders")
          .update({
            customer_name: customerName,
            email,
            product,
            outer_fabric: outerFabric,
            inner_fabric: innerFabric,
            strap_size:
              normalizeOptions(selectedProduct.strap_type_options).length > 0
                ? strapSize
                : null,
            strap_color:
              normalizeOptions(selectedProduct.strap_color_options).length > 0
                ? strapColor
                : null,
            mounting_type:
              normalizeOptions(selectedProduct.mounting_type_options).length > 0
                ? mountingType
                : null,
            price,
            target_completion_date: targetCompletionDate,
          })
          .eq("id", initialOrder.id);

        if (error) {
          console.error("Order update failed:", error.message);
          alert(`Could not update order: ${error.message}`);
          return;
        }

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
    const activeProducts = products.filter((item) => item.active);
    const defaultProduct =
      activeProducts.find((item) => item.name === "Small Sling") ??
      activeProducts[0];

    editInitialConfigurationPreserved.current = false;

    setCustomerName("");
    setEmail("");
    setOrderNumber("");
    setTrackingToken("");
    setTargetCompletionDate("");
    setIsConfirmed(false);

    if (defaultProduct) {
      setProduct(defaultProduct.name);
    } else {
      setProduct("");
      setOuterFabric("");
      setInnerFabric("");
      setStrapSize("");
      setStrapColor("");
      setMountingType("");
      setPrice(0);
    }
  }

  if (productsLoading) {
    return (
      <div className="border border-zinc-200 bg-white p-8 text-sm text-zinc-500">
        Loading products...
      </div>
    );
  }

  if (productsError && !selectedProduct) {
    return (
      <div className="border border-red-200 bg-red-50 p-6">
        <p className="font-medium text-red-800">Could not load products.</p>
        <p className="mt-1 text-sm text-red-700">{productsError}</p>
      </div>
    );
  }

  if (mode === "create" && availableProducts.length === 0) {
    return (
      <div className="border border-zinc-200 bg-white p-8">
        <h2 className="text-xl font-semibold text-zinc-900">
          No active products
        </h2>
        <p className="mt-2 text-sm text-zinc-600">
          Add or activate a product in the Products page before creating an order.
        </p>
      </div>
    );
  }

  return isConfirmed ? (
    <div className="mx-auto max-w-md rounded-xl border bg-white p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
        <span className="text-2xl">✓</span>
      </div>

      <h2 className="text-xl font-semibold text-zinc-900">
        Order Confirmed!
      </h2>

      <p className="mt-2 text-sm text-zinc-900">
        Order <span className="font-mono font-medium">{orderNumber}</span> has
        been saved and the image was downloaded.
      </p>

      <button
        type="button"
        onClick={startNewOrder}
        className="mt-6 w-full rounded-lg bg-black px-5 py-3 font-medium text-white transition-colors hover:bg-zinc-800"
      >
        Start New Order
      </button>
    </div>
  ) : (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="rounded-xl border bg-white p-8 shadow-sm">
        <div>
          <h2 className="text-xl font-semibold text-zinc-800">
            Configure Your Order
          </h2>
          <p className="mt-1 text-sm text-zinc-800">
            Select the product and customize its options.
          </p>
        </div>

        <div className="mt-8">
          <label className="text-sm font-medium text-zinc-800">
            Customer Name
          </label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="mt-2 w-full rounded-lg border px-4 py-3 text-zinc-800"
            placeholder="Juan Dela Cruz"
          />
        </div>

        <div className="mt-6">
          <label className="text-sm font-medium text-zinc-800">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-lg border px-4 py-3 text-zinc-800"
            placeholder="imbentobags@gmail.com"
          />
        </div>

        <div className="mt-8">
          <label className="text-sm font-medium text-zinc-800">
            Target Completion
          </label>
          <p className="mt-1 text-xs text-zinc-500">
            Set the production date you are targeting for this order.
          </p>
          <input
            type="date"
            value={targetCompletionDate}
            onChange={(e) => setTargetCompletionDate(e.target.value)}
            required
            className="mt-3 w-full rounded-lg border px-4 py-3 text-zinc-800"
          />
        </div>

        <div className="mt-8">
          <label className="text-sm font-medium text-zinc-800">Product</label>
          <select
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            className="mt-2 w-full rounded-lg border px-4 py-3 text-zinc-800"
          >
            {mode === "edit" &&
              initialOrder &&
              !availableProducts.some(
                (item) => item.name === initialOrder.product
              ) && (
                <option value={initialOrder.product}>
                  {initialOrder.product} (Legacy)
                </option>
              )}

            {availableProducts.map((productItem) => (
              <option key={productItem.id} value={productItem.name}>
                {productItem.name}
                {!productItem.active ? " (Inactive)" : ""}
              </option>
            ))}
          </select>
        </div>

        {outerFabricOptions.length > 0 && (
          <div className="mt-6">
            <label className="text-sm font-medium text-zinc-800">
              Outer Fabric
            </label>
            <select
              value={outerFabric}
              onChange={(e) => setOuterFabric(e.target.value)}
              className="mt-2 w-full rounded-lg border px-4 py-3 text-zinc-800"
            >
              {outerFabricOptions.map((fabric) => (
                <option key={fabric} value={fabric}>
                  {fabric}
                </option>
              ))}
            </select>
          </div>
        )}

        {innerFabricOptions.length > 0 && (
          <div className="mt-6">
            <label className="text-sm font-medium text-zinc-800">
              Inner Fabric
            </label>
            <select
              value={innerFabric}
              onChange={(e) => setInnerFabric(e.target.value)}
              className="mt-2 w-full rounded-lg border px-4 py-3 text-zinc-800"
            >
              {innerFabricOptions.map((fabric) => (
                <option key={fabric} value={fabric}>
                  {fabric}
                </option>
              ))}
            </select>
          </div>
        )}

        {strapTypeOptions.length > 0 && (
          <div className="mt-6">
            <label className="text-sm font-medium text-zinc-800">
              Strap Type
            </label>
            <select
              value={strapSize}
              onChange={(e) => setStrapSize(e.target.value)}
              className="mt-2 w-full rounded-lg border px-4 py-3 text-zinc-800"
            >
              {strapTypeOptions.map((strapType) => (
                <option key={strapType} value={strapType}>
                  {strapType}
                </option>
              ))}
            </select>
          </div>
        )}

        {strapColorOptions.length > 0 && (
          <div className="mt-6">
            <label className="text-sm font-medium text-zinc-800">
              Strap Color
            </label>
            <select
              value={strapColor}
              onChange={(e) => setStrapColor(e.target.value)}
              className="mt-2 w-full rounded-lg border px-4 py-3 text-zinc-800"
            >
              {strapColorOptions.map((color) => (
                <option key={color} value={color}>
                  {color}
                </option>
              ))}
            </select>
          </div>
        )}

        {mountingTypeOptions.length > 0 && (
          <div className="mt-6">
            <label className="text-sm font-medium text-zinc-800">
              Strap Mounting
            </label>
            <select
              value={mountingType}
              onChange={(e) => setMountingType(e.target.value)}
              className="mt-2 w-full rounded-lg border px-4 py-3 text-zinc-800"
            >
              {mountingTypeOptions.map((mount) => (
                <option key={mount} value={mount}>
                  {mount}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mt-6">
          <label className="text-sm font-medium text-zinc-800">
            Price (₱)
          </label>
          <div className="mt-2 w-full rounded-lg border bg-zinc-50 px-4 py-3 text-zinc-700">
            ₱{price.toFixed(2)}
          </div>
        </div>
      </div>

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
          strapSize={strapTypeOptions.length > 0 ? strapSize : ""}
          strapColor={strapColorOptions.length > 0 ? strapColor : ""}
          mountingType={mountingTypeOptions.length > 0 ? mountingType : ""}
          price={price}
          targetCompletionDate={targetCompletionDate}
          trackingToken={trackingToken}
        />

        <button
          type="button"
          onClick={submitOrder}
          disabled={isSubmitting || !selectedProduct}
          className="mt-6 w-full rounded-lg bg-black px-5 py-3 font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
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