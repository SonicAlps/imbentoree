"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  ArrowRight,
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
  labor_cost: number;
  active: boolean;
  image_url: string | null;
  created_at: string;
  updated_at: string;
};

type OrderRow = {
  product: string | null;
  status: string | null;
};

function peso(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [name, setName] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [active, setActive] = useState(true);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const [productsResult, ordersResult] = await Promise.all([
      supabase
        .from("products")
        .select(`
          id,
          name,
          base_price,
          labor_cost,
          active,
          image_url,
          created_at,
          updated_at
        `)
        .order("created_at", {
          ascending: true,
        }),

      supabase
        .from("orders")
        .select("product, status"),
    ]);

    if (productsResult.error) {
      console.error(productsResult.error);
      alert(productsResult.error.message);
    }

    if (ordersResult.error) {
      console.error(ordersResult.error);
    }

    setProducts((productsResult.data ?? []) as Product[]);
    setOrders((ordersResult.data ?? []) as OrderRow[]);

    setLoading(false);
  }

  const soldCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    for (const order of orders) {
      if (order.status !== "completed") {
        continue;
      }

      const productName = order.product?.trim();

      if (!productName) {
        continue;
      }

      counts[productName] = (counts[productName] ?? 0) + 1;
    }

    return counts;
  }, [orders]);

  function resetForm() {
    setEditingProduct(null);
    setName("");
    setBasePrice("");
    setImageUrl("");
    setActive(true);
    setShowForm(false);
  }

  function openAddProduct() {
    setEditingProduct(null);
    setName("");
    setBasePrice("");
    setImageUrl("");
    setActive(true);
    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function openEditProduct(product: Product) {
    setEditingProduct(product);
    setName(product.name);
    setBasePrice(String(product.base_price));
    setImageUrl(product.image_url ?? "");
    setActive(product.active);
    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function saveProduct(event: React.FormEvent) {
    event.preventDefault();

    const cleanName = name.trim();
    const price = Number(basePrice) || 0;

    if (!cleanName) {
      alert("Enter a product name.");
      return;
    }

    if (price < 0) {
      alert("Selling price cannot be negative.");
      return;
    }

    setSaving(true);

    if (editingProduct) {
      const { error } = await supabase
        .from("products")
        .update({
          name: cleanName,
          base_price: price,
          image_url: imageUrl.trim() || null,
          active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingProduct.id);

      setSaving(false);

      if (error) {
        alert(error.message);
        return;
      }
    } else {
      const { error } = await supabase
        .from("products")
        .insert({
          name: cleanName,
          base_price: price,
          labor_cost: 0,
          image_url: imageUrl.trim() || null,
          active: true,
        });

      setSaving(false);

      if (error) {
        alert(error.message);
        return;
      }
    }

    resetForm();
    await loadData();
  }

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        {/* HEADER */}
        <header className="flex flex-col gap-6 border-b border-black pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500">
              Imbentoree
            </p>

            <h1 className="mt-1 text-4xl font-bold tracking-tight text-black">
              Products
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-600">
              The Imbento Bags product archive. Browse designs, pricing and
              product performance.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddProduct}
            className="inline-flex min-h-11 items-center justify-center gap-2 border border-black bg-white px-5 text-sm font-semibold text-black hover:bg-zinc-50"
          >
            <Plus size={16} />
            Add Product
          </button>
        </header>

        {/* ADD / EDIT PRODUCT */}
        {showForm && (
          <section className="mt-8 border border-black bg-white p-5 md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-black">
                  {editingProduct ? "Edit Product" : "New Product"}
                </h2>

                <p className="mt-1 text-sm text-zinc-600">
                  General catalog information only. Costing and labor are
                  managed under Cost History.
                </p>
              </div>

              <button
                type="button"
                onClick={resetForm}
                className="border border-black bg-white p-2 text-black hover:bg-zinc-50"
              >
                <X size={17} />
              </button>
            </div>

            <form
              onSubmit={saveProduct}
              className="mt-6 grid gap-5 md:grid-cols-2"
            >
              <Field label="Product Name">
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Traffic Handbag"
                  className="mt-2 w-full border border-black bg-white px-4 py-3 text-black outline-none"
                />
              </Field>

              <Field label="Selling Price">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={basePrice}
                  onChange={(event) => setBasePrice(event.target.value)}
                  placeholder="1999"
                  className="mt-2 w-full border border-black bg-white px-4 py-3 text-black outline-none"
                />
              </Field>

              <label className="block md:col-span-2">
                <span className="text-sm font-semibold text-black">
                  Product Photo URL
                </span>

                <input
                  type="text"
                  value={imageUrl}
                  onChange={(event) => setImageUrl(event.target.value)}
                  placeholder="https://..."
                  className="mt-2 w-full border border-black bg-white px-4 py-3 text-black outline-none"
                />

                <p className="mt-2 text-xs text-zinc-500">
                  Direct image upload can replace this later.
                </p>
              </label>

              {editingProduct && (
                <label className="flex items-center gap-3 md:col-span-2">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(event) => setActive(event.target.checked)}
                  />

                  <span className="text-sm font-semibold text-black">
                    Active Product
                  </span>
                </label>
              )}

              <div className="flex flex-wrap gap-3 md:col-span-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex min-h-11 items-center gap-2 border border-black bg-white px-5 text-sm font-semibold text-black hover:bg-zinc-50 disabled:opacity-50"
                >
                  <Save size={16} />

                  {saving
                    ? "Saving..."
                    : editingProduct
                    ? "Save Changes"
                    : "Create Product"}
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  className="min-h-11 border border-zinc-300 bg-white px-5 text-sm font-medium text-zinc-600 hover:border-black hover:text-black"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        {/* CATALOG */}
        <section className="mt-10">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-black">
                Product Catalog
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                {products.length}{" "}
                {products.length === 1 ? "design" : "designs"} in the archive
              </p>
            </div>
          </div>

          {loading ? (
            <div className="border-t border-black py-16 text-sm text-zinc-500">
              Loading products...
            </div>
          ) : products.length === 0 ? (
            <div className="border-y border-black py-16 text-center">
              <ImageIcon size={30} className="mx-auto text-zinc-400" />

              <p className="mt-4 font-semibold text-black">
                Your catalog is empty
              </p>

              <p className="mt-1 text-sm text-zinc-500">
                Add your first Imbento Bags design.
              </p>
            </div>
          ) : (
            <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => {
                const sold = soldCounts[product.name] ?? 0;

                return (
                  <article key={product.id} className="group">
                    {/* PRODUCT PHOTO */}
                    <Link
                      href={`/products/${product.id}`}
                      className="block"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden border border-black bg-white">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.015]"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-white">
                            <div className="text-center text-zinc-400">
                              <ImageIcon size={28} className="mx-auto" />

                              <p className="mt-2 text-xs">
                                No product photo
                              </p>
                            </div>
                          </div>
                        )}

                        {!product.active && (
                          <div className="absolute left-3 top-3 border border-black bg-white px-2 py-1 text-xs font-semibold text-black">
                            Inactive
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* PRODUCT NAME */}
                    <div className="mt-4 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <Link href={`/products/${product.id}`}>
                          <h2 className="truncate text-lg font-bold text-black hover:underline">
                            {product.name}
                          </h2>
                        </Link>

                        <p className="mt-1 text-base font-medium text-zinc-700">
                          {peso(Number(product.base_price))}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => openEditProduct(product)}
                        className="shrink-0 border border-zinc-300 bg-white p-2 text-zinc-500 hover:border-black hover:text-black"
                        aria-label={`Edit ${product.name}`}
                      >
                        <Pencil size={14} />
                      </button>
                    </div>

                    {/* STATS */}
                    <div className="mt-4 border-t border-zinc-300 pt-3">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-black">
                            {sold} {sold === 1 ? "unit sold" : "units sold"}
                          </p>
                        </div>

                        <span className="text-xs font-medium text-zinc-500">
                          {product.active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>

                    {/* VIEW */}
                    <Link
                      href={`/products/${product.id}`}
                      className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-black hover:underline"
                    >
                      View Product
                      <ArrowRight size={14} />
                    </Link>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
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
      <span className="text-sm font-semibold text-black">
        {label}
      </span>

      {children}
    </label>
  );
}