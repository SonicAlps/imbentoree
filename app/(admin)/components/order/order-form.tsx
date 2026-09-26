"use client";

import { useEffect, useState } from "react";
import { toPng } from "html-to-image";
import OrderPreview from "./order-preview";
import { supabase } from "@/src/lib/supabase";
import { toCamelCaseName } from "@/src/lib/format";
import { products, type ProductName } from "@/src/lib/products";

async function generateOrderNumber(): Promise<string> {
  const { data, error } = await supabase.rpc("generate_order_number");
  if (error) throw new Error(`Could not generate order number: ${error.message}`);
  return data as string;
}

type Material = {
  id: string;
  name: string;
  material_type: string | null;
  allowed_uses: string[] | null;
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

type Props = { mode?: "create" | "edit"; initialOrder?: ExistingOrder };

type SelectionKey = "outer_fabric" | "inner_fabric" | "strap" | "strap_mounting";

const FIELDS: { key: SelectionKey; label: string }[] = [
  { key: "outer_fabric", label: "Outer Fabric" },
  { key: "inner_fabric", label: "Inner Fabric" },
  { key: "strap", label: "Strap" },
  { key: "strap_mounting", label: "Strap Mounting" },
];

export default function OrderForm({ mode = "create", initialOrder }: Props) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [customerName, setCustomerName] = useState(initialOrder?.customer_name ?? "");
  const [email, setEmail] = useState(initialOrder?.email ?? "");
  const [product, setProduct] = useState<ProductName>(initialOrder?.product ?? "Small Sling");
  const [price, setPrice] = useState(initialOrder?.price ?? products[initialOrder?.product ?? "Small Sling"].basePrice);
  const [targetCompletionDate, setTargetCompletionDate] = useState(initialOrder?.target_completion_date ?? "");
  const [orderNumber, setOrderNumber] = useState(initialOrder?.order_number ?? "");
  const [trackingToken, setTrackingToken] = useState(initialOrder?.tracking_token ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const [selections, setSelections] = useState<Record<SelectionKey, string>>({
    outer_fabric: initialOrder?.outer_fabric ?? "",
    inner_fabric: initialOrder?.inner_fabric ?? "",
    strap: initialOrder?.strap_color ?? "",
    strap_mounting: initialOrder?.mounting_type ?? "",
  });

  useEffect(() => {
    async function loadMaterials() {
      const { data, error } = await supabase
        .from("materials")
        .select("id, name, material_type, allowed_uses")
        .order("name");
      if (error) return console.error("Failed to load materials:", error.message);
      setMaterials((data as Material[]) || []);
    }
    void loadMaterials();
  }, []);

  useEffect(() => {
    if (mode === "edit" && product === initialOrder?.product) return;
    setPrice(products[product].basePrice);
  }, [product, mode, initialOrder?.product]);

  function optionsFor(use: SelectionKey) {
    return materials.filter((m) => (m.allowed_uses || []).includes(use));
  }

  function updateSelection(key: SelectionKey, value: string) {
    setSelections((current) => ({ ...current, [key]: value }));
  }

  async function generateOrderImage(currentOrderNumber: string) {
    const element = document.getElementById("order-preview");
    if (!element) return;
    const dataUrl = await toPng(element, { pixelRatio: 3 });
    const link = document.createElement("a");
    link.download = `${currentOrderNumber}-${toCamelCaseName(customerName)}.png`;
    link.href = dataUrl;
    link.click();
  }

  async function submitOrder() {
    if (!customerName.trim() || !email.trim()) return alert("Please fill in customer name and email.");
    if (!selections.outer_fabric || !selections.inner_fabric) return alert("Please select the outer and inner fabric.");

    setIsSubmitting(true);
    try {
      const payload = {
        customer_name: customerName.trim(),
        email: email.trim(),
        product,
        outer_fabric: selections.outer_fabric,
        inner_fabric: selections.inner_fabric,
        strap_size: null,
        strap_color: selections.strap || null,
        mounting_type: selections.strap_mounting || null,
        target_completion_date: targetCompletionDate || null,
        price,
      };

      if (mode === "create") {
        const newOrderNumber = await generateOrderNumber();
        const { data, error } = await supabase
          .from("orders")
          .insert([{ order_number: newOrderNumber, ...payload }])
          .select("tracking_token")
          .single();
        if (error) throw new Error(error.message);
        setOrderNumber(newOrderNumber);
        setTrackingToken(data?.tracking_token ?? "");
        await new Promise((r) => setTimeout(r, 100));
        await generateOrderImage(newOrderNumber);
        setIsConfirmed(true);
      } else if (initialOrder) {
        const { error } = await supabase.from("orders").update(payload).eq("id", initialOrder.id);
        if (error) throw new Error(error.message);
        await generateOrderImage(initialOrder.order_number);
        window.location.href = `/orders/${initialOrder.order_number}`;
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not save order.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const previewMaterials = [
    { label: "Outer Fabric", materialName: selections.outer_fabric },
    { label: "Inner Fabric", materialName: selections.inner_fabric },
    { label: "Strap", materialName: selections.strap },
    { label: "Strap Mounting", materialName: selections.strap_mounting },
  ].filter((item) => item.materialName);

  if (isConfirmed) {
    return <div className="mx-auto max-w-md rounded-xl border bg-white p-8 text-center shadow-sm"><h2 className="text-xl font-semibold">Order Confirmed</h2><p className="mt-2 text-sm text-zinc-500"><span className="font-mono">{orderNumber}</span> is now recorded. Production costing happens later in Liquidation.</p><button onClick={() => window.location.reload()} className="mt-6 w-full rounded-lg bg-zinc-900 px-5 py-3 text-white">Start New Order</button></div>;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="rounded-xl border bg-white p-8 shadow-sm text-zinc-900">
        <div><h2 className="text-xl font-semibold">{mode === "edit" ? "Edit Order" : "New Order"}</h2><p className="mt-1 text-sm text-zinc-500">Record what the customer ordered. Material consumption and production cost are handled separately in Liquidation.</p></div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <label className="text-sm font-medium">Customer Name<input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="mt-2 w-full rounded-lg border px-4 py-3" /></label>
          <label className="text-sm font-medium">Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full rounded-lg border px-4 py-3" /></label>
          <label className="text-sm font-medium">Product<select value={product} onChange={(e) => setProduct(e.target.value as ProductName)} className="mt-2 w-full rounded-lg border bg-white px-4 py-3">{Object.keys(products).map((name) => <option key={name}>{name}</option>)}</select></label>
          <label className="text-sm font-medium">Selling Price (₱)<input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(Number(e.target.value))} className="mt-2 w-full rounded-lg border px-4 py-3" /></label>
          <label className="text-sm font-medium sm:col-span-2">Target Completion<input type="date" value={targetCompletionDate} onChange={(e) => setTargetCompletionDate(e.target.value)} className="mt-2 w-full rounded-lg border px-4 py-3" /></label>
        </div>

        <div className="mt-8 border-t pt-6"><h3 className="font-semibold">Customer Configuration</h3><p className="mt-1 text-xs text-zinc-500">These are order specifications only — no quantities or cost calculations here.</p>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            {FIELDS.map((field) => <label key={field.key} className="text-sm font-medium">{field.label}<select value={selections[field.key]} onChange={(e) => updateSelection(field.key, e.target.value)} className="mt-2 w-full rounded-lg border bg-white px-4 py-3"><option value="">Select {field.label}</option>{optionsFor(field.key).map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}</select></label>)}
          </div>
        </div>

        <button disabled={isSubmitting} onClick={submitOrder} className="mt-8 w-full rounded-lg bg-zinc-900 px-5 py-3 font-medium text-white disabled:opacity-50">{isSubmitting ? "Saving..." : mode === "edit" ? "Save Changes" : "Create Order"}</button>
      </div>

      <div><OrderPreview orderNumber={orderNumber || "IMB-XXXX"} customerName={customerName} product={product} buildMaterials={previewMaterials} price={price} targetCompletionDate={targetCompletionDate} trackingToken={trackingToken || undefined} /></div>
    </div>
  );
}
