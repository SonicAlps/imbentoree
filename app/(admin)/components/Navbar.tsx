"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/src/lib/supabase";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const navLinks = [
    { name: "Dashboard", href: "/" },
    { name: "Orders", href: "/orders" },
  ];

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (pathname === "/login") {
    return null;
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 md:px-6 py-3 md:py-4">
          
          {/* LOGO & BRANDING */}
          <Link href="/" className="flex items-center gap-2 md:gap-3 group flex-shrink-0">
            <Image
              src="/logo.png"
              alt="Imbentoree Logo"
              width={60}
              height={60}
              className="md:w-20 md:h-20 w-14 h-14 rounded-md object-contain"
              priority
            />
            <div className="hidden md:block">
              <h1 className="text-xl font-bold tracking-tight text-zinc-900 group-hover:text-zinc-700 transition">
                Imbentoree
              </h1>
              <p className="text-xs text-zinc-500">by imbento Bags</p>
            </div>
          </Link>

          {/* NAVIGATION LINKS - Hidden on mobile */}
          <nav className="hidden md:flex items-center gap-6">
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
          </nav>

          {/* BUTTONS & INFO */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Version - Hidden on mobile */}
            <span className="hidden md:inline font-mono text-xs text-zinc-400">
              V1.5
            </span>

            {/* New Order Button */}
            <Link
              href="/new-order"
              className="rounded-lg bg-red-300 px-3 md:px-4 py-2 text-xs md:text-sm font-medium text-red-900 hover:bg-red-400 transition whitespace-nowrap"
            >
              + New Order
            </Link>

            {/* Logout Button - Hidden on mobile, show as icon */}
            <button
              onClick={handleLogout}
              className="hidden md:block rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition"
            >
              Logout
            </button>

            {/* Mobile Logout Icon */}
            <button
              onClick={handleLogout}
              className="md:hidden text-red-700 hover:text-red-900 transition"
              title="Logout"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>

        </div>
      </header>

      {/* STITCH DIVIDER */}
      <div className="border-b border-dashed border-zinc-300" />
    </>
  );
}