"use client";

import { useState, useEffect } from "react";
import { toPng } from "html-to-image";
import OrderPreview from "./order-preview";
import { supabase } from "@/src/lib/supabase";
import { toCamelCaseName } from "@/src/lib/format";

async function generateOrderNumber(): Promise<string> {
  const { data, error } = await supabase.rpc("generate_order_number");

  if (error) {
    console.error("Failed to generate order number:", error.message);
    return `IMB-ERROR-${Date.now()}`; // fallback so the app doesn't crash
  }

  return data as string;
}

const products = {

  "Pouch": {
    outerFabric: ["Black", "Army Green", "Red", "Dark Pink"],
    innerFabric: ["Orange", "Black", "Red", "Dark Pink", "Neon Green"],
    strapSize: ["1 inch", "1.5 inch", "Paracord"],
    strapColor: ["Army Green", "Black",],
    mountingType: ["Sling Hook", "Buckle"],
    basePrice: 750,
  },

  "Small Sling": {
    outerFabric: ["Black", "Army Green", "Red", "Dark Pink", "Neon Green"],
    innerFabric: ["Orange", "Black", "Red", "Dark Pink", "Neon Green"],
    strapSize: ["1 inch", "1.5 inch", "Paracord"],
    strapColor: ["Army Green", "Black",],
    mountingType: ["Sling Hook", "Buckle"],
    basePrice: 1500,
  },

  
  "Big Sling": {
    outerFabric: ["Black", "Army Green", "Red", "Dark Pink"],
    innerFabric: ["Orange", "Black", "Red", "Dark Pink", "Neon Green"],
    strapSize: ["1 inch", "1.5 inch", "Paracord"],
    strapColor: ["Army Green", "Black", ],
    mountingType: ["Sling Hook", "Buckle"],
    basePrice: 2000,
  },
};

type ProductName = keyof typeof products;

export default function OrderForm() {
  // ---- ALL STATE + FUNCTIONS LIVE HERE, INSIDE THE COMPONENT ----

  const [orderNumber, setOrderNumber] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [product, setProduct] = useState<ProductName>("Small Sling");
  const [outerFabric, setOuterFabric] = useState("Army Green");
  const [innerFabric, setInnerFabric] = useState("Orange");
  const [strapSize, setStrapSize] = useState("1 inch");
  const [strapColor, setStrapColor] = useState("Army Green");
  const [mountingType, setMountingType] = useState("Sling Hook");
  const [price, setPrice] = useState<number>(0);

  const selectedProduct = products[product];
  const [isConfirmed, setIsConfirmed] = useState(false);



  // Auto-reset defaults when switching products (e.g. switching to Pouch)
  useEffect(() => {
    setOuterFabric(selectedProduct.outerFabric[0] || "");
    setInnerFabric(selectedProduct.innerFabric[0] || "");
    setStrapSize(selectedProduct.strapSize[0] || "");
    setStrapColor(selectedProduct.strapColor[0] || "");
    setMountingType(selectedProduct.mountingType[0] || "");
    setPrice(selectedProduct.basePrice);
  }, [product]);

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
    alert("Please fill in customer name and contact number.");
    return;
  }

  setIsSubmitting(true);

  

  const newOrderNumber = await generateOrderNumber();
  setOrderNumber(newOrderNumber); // updates the preview + filename too


  // SUPABASE 

  const { error } = await supabase.from("orders").insert([
    {
      order_number: newOrderNumber,
      customer_name: customerName,
      email: email,
      product: product,
      outer_fabric: outerFabric,
      inner_fabric: innerFabric,
      strap_size: selectedProduct.strapSize.length > 0 ? strapSize : null,
      strap_color: selectedProduct.strapColor.length > 0 ? strapColor : null,
      mounting_type:
        selectedProduct.mountingType.length > 0 ? mountingType : null,
      price: price,

    },
  ]);

  setIsSubmitting(false);

  if (error) {
    console.error("Order save failed:", error.message);
    alert(`Could not save order: ${error.message}`);
    return;
  }

  await generateOrderImage(newOrderNumber);
  setIsConfirmed(true);
}

function startNewOrder() {
  setCustomerName("");
  setEmail("");
  setProduct("Small Sling");
  setOrderNumber("");
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

        {/* OUTER FABRIC */}
        <div className="mt-6">
          <label className="text-sm font-medium text-zinc-800">Outer Fabric</label>
          <select
            value={outerFabric}
            onChange={(e) => setOuterFabric(e.target.value)}
            className="mt-2 w-full rounded-lg border px-4 py-3 text-zinc-800"
          >
            {selectedProduct.outerFabric.map((fabric) => (
              <option key={fabric} value={fabric}>
                {fabric}
              </option>
            ))}
          </select>
        </div>

        {/* INNER FABRIC */}
        <div className="mt-6">
          <label className="text-sm font-medium text-zinc-800">Inner Fabric</label>
          <select
            value={innerFabric}
            onChange={(e) => setInnerFabric(e.target.value)}
            className="mt-2 w-full rounded-lg border px-4 py-3 text-zinc-800"
          >
            {selectedProduct.innerFabric.map((fabric) => (
              <option key={fabric} value={fabric}>
                {fabric}
              </option>
            ))}
          </select>
        </div>

        {/* STRAP SIZE */}
        {selectedProduct.strapSize.length > 0 && (
          <div className="mt-6">
            <label className="text-sm font-medium text-zinc-800">Strap Size</label>
            <select
              value={strapSize}
              onChange={(e) => setStrapSize(e.target.value)}
              className="mt-2 w-full rounded-lg border px-4 py-3 text-zinc-800"
            >
              {selectedProduct.strapSize.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* STRAP COLOR */}
        {selectedProduct.strapColor.length > 0 && (
          <div className="mt-6">
            <label className="text-sm font-medium text-zinc-800">Strap Color</label>
            <select
              value={strapColor}
              onChange={(e) => setStrapColor(e.target.value)}
              className="mt-2 w-full rounded-lg border px-4 py-3 text-zinc-800"
            >
              {selectedProduct.strapColor.map((color) => (
                <option key={color} value={color}>
                  {color}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* MOUNTING TYPE */}
        {selectedProduct.mountingType.length > 0 && (
          <div className="mt-6">
            <label className="text-sm font-medium text-zinc-800">Strap Mounting</label>
            <select
              value={mountingType}
              onChange={(e) => setMountingType(e.target.value)}
              className="mt-2 w-full rounded-lg border px-4 py-3 text-zinc-800"
            >
              {selectedProduct.mountingType.map((mount) => (
                <option key={mount} value={mount}>
                  {mount}
                </option>
              ))}
            </select>
          </div>
        )}

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
            Photo will be generated after order confirmation.
          </p>
        </div>

        <OrderPreview
          orderNumber={orderNumber}
          customerName={customerName}
          product={product}
          outerFabric={outerFabric}
          innerFabric={innerFabric}
          strapSize={selectedProduct.strapSize.length > 0 ? strapSize : ""}
          strapColor={selectedProduct.strapColor.length > 0 ? strapColor : ""}
          mountingType={
            selectedProduct.mountingType.length > 0 ? mountingType : ""
          }
          price={price}
        />

        <button
          type="button"
          onClick={submitOrder}
          disabled={isSubmitting}
          className="mt-6 w-full rounded-lg bg-black px-5 py-3 font-medium text-white hover:bg-zinc-800 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : "Confirm Order"}
        </button>
      </div>
    </div>
  );
}
