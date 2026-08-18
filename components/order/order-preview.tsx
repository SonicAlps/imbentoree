// components/order/order-preview.tsx
import { toCamelCaseName } from "@/src/lib/format";
import Image from "next/image";

interface OrderPreviewProps {
  orderNumber: string;
  customerName: string;
  product: string;
  outerFabric: string;
  innerFabric: string;
  strapSize: string;
  strapColor: string;
  mountingType: string;
  price: number;
}

export default function OrderPreview({
  orderNumber,
  customerName,
  product,
  outerFabric,
  innerFabric,
  strapSize,
  strapColor,
  mountingType,
  price,

}: OrderPreviewProps) {
  const fileName = `${orderNumber}-${toCamelCaseName(customerName)}.png`;;

  return (
    <div
      id="order-preview"
      style={{ minHeight: "480px" }} // 1. Force explicit min-height so flex layout expands fully
      className="w-full flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-6 shadow-sm text-zinc-900"
    >
      {/* MAIN TOP CONTENT */}
            
      <div className="w-full">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b pb-4">

            {/* LOGO + TITLE */}
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Imbento Bags"
              width={48}
              height={48}
              className="h-12 w-12 object-contain"
            />
           
          

          <div>
             <h1 className="text-lg font-bold tracking-tight">Imbento Bags</h1>
            <p className="text-xs text-zinc-500">Custom Order Ticket</p>
          </div>

          
        </div>
        <span className="rounded bg-black px-2.5 py-1 text-xs font-mono font-medium text-white">
            {orderNumber}
          </span>
        </div>

        {/* SPECIFICATIONS */}
        <div className="mt-6 space-y-3 text-sm">
  <div className="flex justify-between border-b pb-2">
    <span className="text-zinc-8000">Customer:</span>
    <span className="font-semibold">{customerName}</span>
  </div>
  </div>

        
        <div className="mt-6 space-y-3 text-sm">
          <div className="flex justify-between border-b pb-2">
            <span className="text-zinc-500">Product:</span>
            <span className="font-semibold">{product}</span>
          </div>

          <div className="flex justify-between border-b pb-2">
            <span className="text-zinc-500">Outer Fabric:</span>
            <span className="font-medium">{outerFabric}</span>
          </div>

          <div className="flex justify-between border-b pb-2">
            <span className="text-zinc-500">Inner Fabric:</span>
            <span className="font-medium">{innerFabric}</span>
          </div>

          {strapSize && (
            <div className="flex justify-between border-b pb-2">
              <span className="text-zinc-500">Strap Size:</span>
              <span className="font-medium">{strapSize}</span>
            </div>
          )}

          {strapColor && (
            <div className="flex justify-between border-b pb-2">
              <span className="text-zinc-500">Strap Color:</span>
              <span className="font-medium">{strapColor}</span>
            </div>
          )}

          {mountingType && (
            <div className="flex justify-between border-b pb-2">
              <span className="text-zinc-500">Strap Mounting:</span>
              <span className="font-medium">{mountingType}</span>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-500">Total</span>
            <span className="rounded bg-black px-3 py-1.5 font-mono text-lg font-bold text-white">
              ₱{price.toFixed(2)}
              </span>
            </div>

          
        </div>
      </div>

      {/* 2. FOOTER - ALWAYS ANCHORED AT THE BOTTOM EDGE */}
      <div className="mt-8 pt-4 border-t border-dashed border-zinc-200 flex items-center justify-between text-xs">
        <span className="text-zinc-400 font-medium">Thank you, {customerName}, for ordering the {product}! </span>
        
      </div>
    </div>
  );
}