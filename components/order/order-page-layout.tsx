// app/components/order/order-page-layout.tsx
"use client";

import { ReactNode } from "react";

type OrderPageLayoutProps = {
  title: string;
  subtitle: string;
  orderNumber?: string;
  children: ReactNode;
};

export default function OrderPageLayout({
  title,
  subtitle,
  orderNumber,
  children,
}: OrderPageLayoutProps) {
  return (
    <main className="min-h-screen bg-black">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-6 py-5">
          {orderNumber && (
            <p className="font-mono text-sm text-zinc-500">{orderNumber}</p>
          )}
          <h1 className="mt-1 text-4xl font-bold text-zinc-800">{title}</h1>
          <p className="mt-2 text-sm text-zinc-500">{subtitle}</p>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-0 py-7">{children}</section>
    </main>
  );
}