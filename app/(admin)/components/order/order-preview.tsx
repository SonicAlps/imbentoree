// components/order/order-preview.tsx

import { toCamelCaseName } from "@/src/lib/format";
import Image from "next/image";
import QRCodeSVG from "react-qr-code";

interface OrderPreviewProps {
  orderNumber: string;
  customerName: string;
  product: string;
  outerFabric: string;
  innerFabric: string;
  strapMaterial: string;
  hardware: string;
  price: number;
  targetCompletionDate: string;
  trackingToken?: string;
}

export default function OrderPreview({
  orderNumber,
  customerName,
  product,
  outerFabric,
  innerFabric,
  strapMaterial,
  hardware,
  price,
  targetCompletionDate,
  trackingToken,
}: OrderPreviewProps) {
  const fileName = `${orderNumber}-${toCamelCaseName(customerName)}.png`;

  const trackingUrl =
    trackingToken && process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/track/${trackingToken}`
      : "";

  return (
    <div
      id="order-preview"
      style={{ minHeight: "480px" }}
      className="flex w-full flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-900 shadow-sm"
      data-filename={fileName}
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
              <h1 className="text-lg font-bold tracking-tight">
                Imbento Bags
              </h1>

              <p className="text-xs text-zinc-500">
                Custom Order Ticket
              </p>
            </div>
          </div>

          {/* ORDER NUMBER */}
          <span className="rounded bg-black px-2.5 py-1 font-mono text-xs font-medium text-white">
            {orderNumber || "NEW ORDER"}
          </span>
        </div>

        {/* CUSTOMER */}
        <div className="mt-6 space-y-3 text-sm">
          <div className="flex justify-between border-b pb-2">
            <span className="text-zinc-500">
              Customer:
            </span>

            <span className="font-semibold">
              {customerName || "—"}
            </span>
          </div>
        </div>

        {/* SPECIFICATIONS */}
        <div className="mt-6 space-y-3 text-sm">
          <div className="flex justify-between border-b pb-2">
            <span className="text-zinc-500">
              Product:
            </span>

            <span className="font-semibold">
              {product}
            </span>
          </div>

          {outerFabric && (
            <div className="flex justify-between border-b pb-2">
              <span className="text-zinc-500">
                Outer Fabric:
              </span>

              <span className="font-medium">
                {outerFabric}
              </span>
            </div>
          )}

          {innerFabric && (
            <div className="flex justify-between border-b pb-2">
              <span className="text-zinc-500">
                Inner Fabric:
              </span>

              <span className="font-medium">
                {innerFabric}
              </span>
            </div>
          )}

          {strapMaterial && (
            <div className="flex justify-between border-b pb-2">
              <span className="text-zinc-500">
                Strap:
              </span>

              <span className="font-medium">
                {strapMaterial}
              </span>
            </div>
          )}

          {hardware && (
            <div className="flex justify-between border-b pb-2">
              <span className="text-zinc-500">
                Hardware:
              </span>

              <span className="font-medium">
                {hardware}
              </span>
            </div>
          )}

          {/* TARGET COMPLETION */}
          {targetCompletionDate && (
            <div className="mt-6 flex items-center justify-between rounded-lg bg-zinc-100 px-3 py-2.5">
              <span className="text-sm font-semibold text-zinc-600">
                Target Completion
              </span>

              <span className="font-mono text-sm font-bold text-zinc-900">
                {new Date(
                  `${targetCompletionDate}T00:00:00`
                ).toLocaleDateString("en-PH", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          )}

          {/* TOTAL */}
          <div className="mt-6 flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-500">
              Total
            </span>

            <span className="rounded bg-black px-3 py-1.5 font-mono text-lg font-bold text-white">
              ₱{price.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="mt-8 flex items-center justify-between border-t border-dashed border-zinc-200 pt-4">
        <span className="block text-xs font-medium text-zinc-400">
          Thank you, {customerName || "customer"}, for ordering the{" "}
          {product}!
        </span>

        {/* QR CODE */}
        {trackingUrl && (
          <div className="flex flex-col items-center gap-1">
            <QRCodeSVG
              value={trackingUrl}
              size={50}
              level="H"
              bgColor="white"
              fgColor="black"
            />

            <p className="text-xs text-zinc-500">
              Scan to track
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
