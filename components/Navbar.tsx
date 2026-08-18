"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { name: "Dashboard", href: "/" },
    { name: "New Order", href: "/new-order" },
    { name: "Orders", href: "/orders" },
    
  ];

  return (
    <>
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          {/* LOGO & BRANDING */}
          <Link href="/" className="flex items-center gap-3 group">
            <Image
              src="/logo.png" // Place your logo in /public/logo.png
              alt="Imbentoree Logo"
              width={80}
              height={80}
              className="rounded-md object-contain"
              priority
            />
            <div>
              <h1 className="text-xl font-bold tracking-tight text-zinc-900 group-hover:text-zinc-700 transition">
                Imbentoree
              </h1>
              <p className="text-xs text-zinc-500">by imbento Bags</p>
            </div>
          </Link>

          {/* NAVIGATION LINKS */}
          <nav className="flex items-center gap-6">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition ${
                    isActive
                      ? "text-zinc-900 font-semibold underline underline-offset-4 decoration-2"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
            <span className="font-mono text-xs text-zinc-400">V1 · Dashboard</span>
          </nav>
        </div>
      </header>

      {/* STITCH DIVIDER */}
      <div className="border-b border-dashed border-zinc-300" />
    </>
  );
}