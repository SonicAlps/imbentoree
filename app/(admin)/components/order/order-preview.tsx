// components/order/order-preview.tsx

"use client";

import { toCamelCaseName } from "@/src/lib/format";
import Image from "next/image";
import QRCodeSVG from "react-qr-code";

type PreviewMaterial = {
  label: string;
  materialName: string;
};

interface OrderPreviewProps {
  orderNumber: string;
  customerName: string;
  product: string;
  buildMaterials: PreviewMaterial[];
  price: number;
  targetCompletionDate: string;
  trackingToken?: string;
}

const normalizeLabel = (value: string) =>
  value.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");

export default function OrderPreview({
  orderNumber,
  customerName,
  product,
  buildMaterials,
  price,
  targetCompletionDate,
  trackingToken,
}: OrderPreviewProps) {
  const fileName = `${orderNumber}-${toCamelCaseName(customerName)}.png`;

  const trackingUrl =
    trackingToken && process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/track/${trackingToken}`
      : "";

  // The order/build sheet stays completely flexible.
  // These mappings only control how that flexible data is PRESENTED
  // on the customer-facing order ticket.
  const outerFabric = buildMaterials.find(
    (item) => normalizeLabel(item.label) === "outer fabric"
  )?.materialName;

  const innerFabric = buildMaterials.find(
    (item) => normalizeLabel(item.label) === "inner fabric"
  )?.materialName;

  const strapMaterials = buildMaterials
    .filter((item) => {
      const label = normalizeLabel(item.label);
      return label === "strap" || label.includes("strap material") || label.includes("paracord");
    })
    .map((item) => item.materialName);

  const primaryLabels = new Set([
    "outer fabric",
    "inner fabric",
    "strap",
    "strap material",
  ]);

  const hardwareAndOtherComponents = buildMaterials.filter((item) => {
    const label = normalizeLabel(item.label);

    if (primaryLabels.has(label)) return false;
    if (label.includes("paracord")) return false;

    return true;
  });

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
              <h1 className="text-lg font-bold tracking-tight">Imbento Bags</h1>
              <p className="text-xs text-zinc-500">Custom Order Ticket</p>
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
            <span className="text-zinc-500">Customer:</span>
            <span className="font-semibold">{customerName || "—"}</span>
          </div>
        </div>

        {/* SPECIFICATIONS */}
        <div className="mt-6 space-y-3 text-sm">
          <div className="flex justify-between border-b pb-2">
            <span className="text-zinc-500">Product:</span>
            <span className="font-semibold">{product}</span>
          </div>

          {outerFabric && (
            <div className="flex justify-between border-b pb-2">
              <span className="text-zinc-500">Outer Fabric:</span>
              <span className="font-medium">{outerFabric}</span>
            </div>
          )}

          {innerFabric && (
            <div className="flex justify-between border-b pb-2">
              <span className="text-zinc-500">Inner Fabric:</span>
              <span className="font-medium">{innerFabric}</span>
            </div>
          )}

          {strapMaterials.length > 0 && (
            <div className="flex justify-between gap-6 border-b pb-2">
              <span className="shrink-0 text-zinc-500">Strap:</span>
              <div className="space-y-1 text-right font-medium">
                {strapMaterials.map((materialName, index) => (
                  <div key={`${materialName}-${index}`}>{materialName}</div>
                ))}
              </div>
            </div>
          )}

          {hardwareAndOtherComponents.length > 0 && (
            <div className="flex justify-between gap-6 border-b pb-2">
              <span className="shrink-0 text-zinc-500">Hardware:</span>
              <div className="space-y-1 text-right">
                {hardwareAndOtherComponents.map((item, index) => (
                  <div
                    key={`${item.label}-${item.materialName}-${index}`}
                    className="font-medium"
                  >
                    <span>{item.materialName}</span>
                    {item.label && normalizeLabel(item.label) !== "hardware" ? (
                      <span className="ml-1.5 text-xs font-normal text-zinc-400">
                        ({item.label})
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TARGET COMPLETION */}
          {targetCompletionDate && (
            <div className="mt-6 flex items-center justify-between rounded-lg bg-zinc-100 px-3 py-2.5">
              <span className="text-sm font-semibold text-zinc-600">
                Target Completion
              </span>

              <span className="font-mono text-sm font-bold text-zinc-900">
                {new Date(`${targetCompletionDate}T00:00:00`).toLocaleDateString(
                  "en-PH",
                  {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  }
                )}
              </span>
            </div>
          )}

          {/* TOTAL */}
          <div className="mt-6 flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-500">Total</span>
            <span className="rounded bg-black px-3 py-1.5 font-mono text-lg font-bold text-white">
              ₱{price.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="mt-8 flex items-center justify-between border-t border-dashed border-zinc-200 pt-4">
        <span className="block text-xs font-medium text-zinc-400">
          Thank you, {customerName || "customer"}, for ordering the {product}!
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
            <p className="text-xs text-zinc-500">Scan to track</p>
          </div>
        )}
      </div>
    </div>
  );
}
