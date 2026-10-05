"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import {
  ArrowLeft,
  ImageIcon,
  Pencil,
  Plus,
  Save,
  X,
} from "lucide-react";

import { supabase } from "@/src/lib/supabase";

type Product = {
  id: string;
  name: string;
  base_price: number;
  active: boolean;
  image_url: string | null;
  description: string | null;

  outer_fabric_options: string[];
  inner_fabric_options: string[];
  strap_type_options: string[];
  strap_color_options: string[];
  mounting_type_options: string[];

  created_at: string;
  updated_at: string;
};

type OrderRow = {
  product: string | null;
  outer_fabric: string | null;
  inner_fabric: string | null;
  strap_size: string | null;
  strap_color: string | null;
  mounting_type: string | null;
  price: number | null;
  status: string | null;
  created_at: string;
};

type Tab = "overview" | "options" | "stats";

function peso(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(value);
}

function countValues(values: Array<string | null>) {
  const counts: Record<string, number> = {};

  for (const value of values) {
    const clean = value?.trim();

    if (!clean) continue;

    counts[clean] = (counts[clean] ?? 0) + 1;
  }

  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

export default function ProductProfilePage() {
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState<Tab>("overview");
  const [editingOverview, setEditingOverview] = useState(false);

  const [name, setName] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [active, setActive] = useState(true);

  useEffect(() => {
    void load();
  }, [productId]);

  async function load() {
    setLoading(true);

    const { data: productData, error: productError } = await supabase
      .from("products")
      .select(`
        id,
        name,
        base_price,
        active,
        image_url,
        description,
        outer_fabric_options,
        inner_fabric_options,
        strap_type_options,
        strap_color_options,
        mounting_type_options,
        created_at,
        updated_at
      `)
      .eq("id", productId)
      .single();

    if (productError) {
      alert(productError.message);
      setLoading(false);
      return;
    }

    const loadedProduct = productData as Product;

    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .select(`
        product,
        outer_fabric,
        inner_fabric,
        strap_size,
        strap_color,
        mounting_type,
        price,
        status,
        created_at
      `)
      .eq("product", loadedProduct.name);

    if (orderError) {
      console.error(orderError);
    }

    setProduct(loadedProduct);
    setOrders((orderData ?? []) as OrderRow[]);

    setName(loadedProduct.name);
    setBasePrice(String(loadedProduct.base_price));
    setDescription(loadedProduct.description ?? "");
    setImageUrl(loadedProduct.image_url ?? "");
    setActive(loadedProduct.active);

    setLoading(false);
  }

  const completedOrders = useMemo(() => {
    return orders.filter((order) => order.status === "completed");
  }, [orders]);

  const totalRevenue = useMemo(() => {
    return completedOrders.reduce(
      (total, order) => total + Number(order.price ?? 0),
      0
    );
  }, [completedOrders]);

  const topOuter = countValues(
    completedOrders.map((order) => order.outer_fabric)
  );

  const topInner = countValues(
    completedOrders.map((order) => order.inner_fabric)
  );

  const topStrap = countValues(
    completedOrders.map((order) => order.strap_size)
  );

  const topStrapColor = countValues(
    completedOrders.map((order) => order.strap_color)
  );

  const topMount = countValues(
    completedOrders.map((order) => order.mounting_type)
  );

  const availableMaterials = useMemo(() => {
    if (!product) return [];

    return Array.from(
      new Set([
        ...product.outer_fabric_options,
        ...product.inner_fabric_options,
      ])
    );
  }, [product]);

  async function saveOverview() {
    if (!product) return;

    const cleanName = name.trim();

    if (!cleanName) {
      alert("Product name is required.");
      return;
    }

    const { error } = await supabase
      .from("products")
      .update({
        name: cleanName,
        base_price: Number(basePrice) || 0,
        description: description.trim() || null,
        image_url: imageUrl.trim() || null,
        active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId);

    if (error) {
      alert(error.message);
      return;
    }

    setEditingOverview(false);
    await load();
  }

  async function updateOptions(
    field:
      | "outer_fabric_options"
      | "inner_fabric_options"
      | "strap_type_options"
      | "strap_color_options"
      | "mounting_type_options",
    options: string[]
  ) {
    const { error } = await supabase
      .from("products")
      .update({
        [field]: options,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId);

    if (error) {
      alert(error.message);
      return;
    }

    setProduct((current) =>
      current
        ? {
            ...current,
            [field]: options,
          }
        : current
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white px-6 py-8 text-black">
        <p className="text-sm text-zinc-500">Loading product...</p>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-white px-6 py-8 text-black">
        Product not found.
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        {/* BACK */}
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-black"
        >
          <ArrowLeft size={16} />
          Products
        </Link>

        {/* TABS */}
        <div className="mt-8 flex gap-7 overflow-x-auto border-b border-black">
          <TabButton
            active={tab === "overview"}
            onClick={() => setTab("overview")}
          >
            Overview
          </TabButton>

          <TabButton
            active={tab === "options"}
            onClick={() => setTab("options")}
          >
            Order Options
          </TabButton>

          <TabButton
            active={tab === "stats"}
            onClick={() => setTab("stats")}
          >
            Stats
          </TabButton>
        </div>

        {/* OVERVIEW */}
        {tab === "overview" && (
          <div className="mt-10 grid gap-10 lg:grid-cols-[300px_minmax(0,1fr)_260px]">
            {/* PHOTO */}
            <div>
              <div className="overflow-hidden border border-black bg-white">
                <div className="aspect-[4/5]">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-white">
                      <div className="text-center text-zinc-400">
                        <ImageIcon size={34} className="mx-auto" />

                        <p className="mt-3 text-sm">No product photo</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* MAIN CONTENT */}
            <article className="min-w-0 bg-white text-black">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <h1 className="text-4xl font-bold tracking-tight text-black md:text-5xl">
                    {product.name}
                  </h1>

                  <p className="mt-3 text-xl font-medium text-zinc-700">
                    {peso(Number(product.base_price))}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setEditingOverview(true)}
                  className="inline-flex shrink-0 items-center gap-2 border border-black bg-white px-4 py-2.5 text-sm font-medium text-black hover:bg-zinc-50"
                >
                  <Pencil size={15} />
                  Edit
                </button>
              </div>

              {/* ABOUT */}
              <section className="mt-10 border-t border-black pt-6">
                <h2 className="text-lg font-bold text-black">About</h2>

                {product.description ? (
                  <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-700">
                    {product.description}
                  </p>
                ) : (
                  <p className="mt-4 text-sm italic text-zinc-500">
                    No description yet.
                  </p>
                )}
              </section>

              {/* AVAILABLE MATERIALS */}
              <section className="mt-10 border-t border-black pt-6">
                <h2 className="text-xl font-bold text-black">
                  Available Materials
                </h2>

                <p className="mt-2 text-sm text-zinc-600">
                  Available fabric choices for this product.
                </p>

                {availableMaterials.length > 0 ? (
                  <div className="mt-5 grid gap-2 sm:grid-cols-2">
                    {availableMaterials.map((material) => (
                      <div
                        key={material}
                        className="border-b border-zinc-200 py-2 text-sm font-medium text-black"
                      >
                        {material}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-zinc-500">
                    No material options configured.
                  </p>
                )}
              </section>

              {/* GENERIC INFO */}
              <div className="mt-10 space-y-8 border-t border-black pt-6">
                <InfoSection
                  title="Strap Type"
                  values={product.strap_type_options}
                />

                <InfoSection
                  title="Strap Color"
                  values={product.strap_color_options}
                />

                <InfoSection
                  title="Strap Mount"
                  values={product.mounting_type_options}
                />
              </div>
            </article>

            {/* SIDEBAR */}
            <aside className="space-y-5">
              <InfoBox title="Product Info">
                <InfoRow
                  label="Price"
                  value={peso(Number(product.base_price))}
                />

                <InfoRow
                  label="Status"
                  value={product.active ? "Active" : "Inactive"}
                />

                <InfoRow
                  label="Units Sold"
                  value={String(completedOrders.length)}
                />

                <InfoRow
                  label="Revenue"
                  value={peso(totalRevenue)}
                />
              </InfoBox>

              <InfoBox title="Popular Choices">
                <InfoRow
                  label="Outer Fabric"
                  value={topOuter[0]?.[0] ?? "—"}
                />

                <InfoRow
                  label="Strap"
                  value={topStrap[0]?.[0] ?? "—"}
                />

                <InfoRow
                  label="Mount"
                  value={topMount[0]?.[0] ?? "—"}
                />
              </InfoBox>
            </aside>
          </div>
        )}

        {/* ORDER OPTIONS */}
        {tab === "options" && (
          <div className="mt-10">
            <div className="mb-8 max-w-2xl">
              <h1 className="text-3xl font-bold text-black">
                Order Options
              </h1>

              <p className="mt-2 text-sm leading-6 text-zinc-600">
                These are the customer-facing choices available when creating
                an order for {product.name}.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <OptionEditor
                title="Outer Fabric"
                description="Available outer fabric choices."
                values={product.outer_fabric_options}
                onChange={(values) =>
                  void updateOptions("outer_fabric_options", values)
                }
              />

              <OptionEditor
                title="Inner Fabric"
                description="Available lining and inner fabric choices."
                values={product.inner_fabric_options}
                onChange={(values) =>
                  void updateOptions("inner_fabric_options", values)
                }
              />

              <OptionEditor
                title="Strap Type"
                description="Examples: Paracord, Flat Strap, 1 inch or 1.5 inch."
                values={product.strap_type_options}
                onChange={(values) =>
                  void updateOptions("strap_type_options", values)
                }
              />

              <OptionEditor
                title="Strap Color"
                description="Available strap colors."
                values={product.strap_color_options}
                onChange={(values) =>
                  void updateOptions("strap_color_options", values)
                }
              />

              <OptionEditor
                title="Strap Mount"
                description="Examples: Sling Hook or Buckle."
                values={product.mounting_type_options}
                onChange={(values) =>
                  void updateOptions("mounting_type_options", values)
                }
              />
            </div>
          </div>
        )}

        {/* STATS */}
        {tab === "stats" && (
          <div className="mt-10">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-black">Product Stats</h1>

              <p className="mt-2 text-sm text-zinc-600">
                Data pulled from existing orders for {product.name}.
              </p>
            </div>

            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Units Sold"
                value={String(completedOrders.length)}
              />

              <StatCard label="Revenue" value={peso(totalRevenue)} />

              <StatCard label="Total Orders" value={String(orders.length)} />

              <StatCard
                label="Selling Price"
                value={peso(Number(product.base_price))}
              />
            </section>

            <section className="mt-8 grid gap-6 lg:grid-cols-2">
              <Ranking title="Outer Fabric" values={topOuter} />

              <Ranking title="Inner Fabric" values={topInner} />

              <Ranking title="Strap Type" values={topStrap} />

              <Ranking title="Strap Color" values={topStrapColor} />

              <Ranking title="Strap Mount" values={topMount} />
            </section>
          </div>
        )}

        {/* EDIT PRODUCT */}
        {editingOverview && (
          <section className="mt-10 border border-black bg-white p-6 text-black">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-black">Edit Product</h2>

                <p className="mt-1 text-sm text-zinc-600">
                  General catalog information.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setEditingOverview(false)}
                className="border border-black bg-white p-2 text-black hover:bg-zinc-50"
              >
                <X size={17} />
              </button>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <Field label="Product Name">
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="mt-2 w-full border border-black bg-white px-4 py-3 text-black outline-none"
                />
              </Field>

              <Field label="Selling Price">
                <input
                  type="number"
                  min="0"
                  value={basePrice}
                  onChange={(event) => setBasePrice(event.target.value)}
                  className="mt-2 w-full border border-black bg-white px-4 py-3 text-black outline-none"
                />
              </Field>

              <Field label="Photo URL">
                <input
                  value={imageUrl}
                  onChange={(event) => setImageUrl(event.target.value)}
                  className="mt-2 w-full border border-black bg-white px-4 py-3 text-black outline-none"
                />
              </Field>

              <label className="flex items-center gap-3 pt-8">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(event) => setActive(event.target.checked)}
                />

                <span className="text-sm font-medium text-black">
                  Active Product
                </span>
              </label>

              <label className="block md:col-span-2">
                <span className="text-sm font-semibold text-black">
                  Description
                </span>

                <textarea
                  rows={5}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Describe the design, purpose and character of this bag..."
                  className="mt-2 w-full border border-black bg-white px-4 py-3 text-black outline-none"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={() => void saveOverview()}
              className="mt-6 inline-flex items-center gap-2 border border-black bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-zinc-50"
            >
              <Save size={16} />
              Save Changes
            </button>
          </section>
        )}
      </div>
    </main>
  );
}

/* =========================================================
   SMALL COMPONENTS
========================================================= */

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
      className={`shrink-0 border-b-2 px-1 py-3 text-sm font-semibold ${
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
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-black">{label}</span>
      {children}
    </label>
  );
}

function InfoSection({
  title,
  values,
}: {
  title: string;
  values: string[];
}) {
  return (
    <section>
      <h2 className="text-xl font-bold text-black">{title}</h2>

      {values.length > 0 ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {values.map((value) => (
            <div
              key={value}
              className="border-b border-zinc-200 py-2 text-sm font-medium text-black"
            >
              {value}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-zinc-500">No options configured.</p>
      )}
    </section>
  );
}

function InfoBox({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-black bg-white">
      <div className="border-b border-black bg-white px-4 py-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-black">
          {title}
        </h2>
      </div>

      <div>{children}</div>
    </section>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-4 py-3 text-sm last:border-b-0">
      <span className="text-zinc-600">{label}</span>

      <span className="text-right font-semibold text-black">{value}</span>
    </div>
  );
}

function OptionEditor({
  title,
  description,
  values,
  onChange,
}: {
  title: string;
  description: string;
  values: string[];
  onChange: (values: string[]) => void;
}) {
  const [newValue, setNewValue] = useState("");

  function add() {
    const clean = newValue.trim();

    if (!clean) return;

    const exists = values.some(
      (value) => value.toLowerCase() === clean.toLowerCase()
    );

    if (exists) {
      setNewValue("");
      return;
    }

    onChange([...values, clean]);
    setNewValue("");
  }

  function remove(value: string) {
    onChange(values.filter((item) => item !== value));
  }

  return (
    <section className="border border-black bg-white p-5">
      <h2 className="text-lg font-bold text-black">{title}</h2>

      <p className="mt-1 text-sm leading-6 text-zinc-600">{description}</p>

      <div className="mt-5">
        {values.length === 0 ? (
          <p className="text-sm text-zinc-500">No options added yet.</p>
        ) : (
          <div className="divide-y divide-zinc-200 border-y border-zinc-200">
            {values.map((value) => (
              <div
                key={value}
                className="flex items-center justify-between py-3"
              >
                <span className="text-sm font-medium text-black">{value}</span>

                <button
                  type="button"
                  onClick={() => remove(value)}
                  className="text-zinc-400 hover:text-black"
                  aria-label={`Remove ${value}`}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-5 flex gap-2">
        <input
          value={newValue}
          onChange={(event) => setNewValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add();
            }
          }}
          placeholder={`Add ${title.toLowerCase()}...`}
          className="min-w-0 flex-1 border border-black bg-white px-4 py-2.5 text-black outline-none"
        />

        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-2 border border-black bg-white px-4 text-sm font-semibold text-black hover:bg-zinc-50"
        >
          <Plus size={15} />
          Add
        </button>
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border border-black bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-600">
        {label}
      </p>

      <p className="mt-3 text-2xl font-bold tracking-tight text-black">
        {value}
      </p>
    </div>
  );
}

function Ranking({
  title,
  values,
}: {
  title: string;
  values: Array<[string, number]>;
}) {
  return (
    <section className="border border-black bg-white">
      <div className="border-b border-black px-5 py-4">
        <h2 className="font-bold text-black">{title}</h2>
      </div>

      {values.length === 0 ? (
        <p className="p-5 text-sm text-zinc-500">
          No completed-order data yet.
        </p>
      ) : (
        <div>
          {values.map(([value, count], index) => (
            <div
              key={value}
              className="flex items-center justify-between border-b border-zinc-200 px-5 py-3 last:border-b-0"
            >
              <div className="flex items-center gap-4">
                <span className="w-5 text-xs text-zinc-500">
                  {index + 1}
                </span>

                <span className="text-sm font-semibold text-black">
                  {value}
                </span>
              </div>

              <span className="text-sm text-zinc-600">{count}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}