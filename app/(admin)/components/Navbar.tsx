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
    { name: "Materials", href: "/materials" },
    { name: "Product Costs", href: "/product-costs" },
  ];

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  function isActiveLink(href: string) {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  if (pathname === "/login") {
    return null;
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
          {/* LEFT SIDE */}
          <div className="flex items-center gap-8">
            {/* LOGO */}
            <Link
              href="/"
              className="group flex flex-shrink-0 items-center gap-3"
            >
              <Image
                src="/logo.png"
                alt="Imbentoree Logo"
                width={56}
                height={56}
                className="h-12 w-12 rounded-md object-contain md:h-14 md:w-14"
                priority
              />

              <div className="hidden lg:block">
                <h1 className="text-lg font-bold tracking-tight text-zinc-900 transition group-hover:text-zinc-700">
                  Imbentoree
                </h1>

                <p className="text-[11px] text-zinc-400">
                  by Imbento Bags
                </p>
              </div>
            </Link>

            {/* DESKTOP NAVIGATION */}
            <nav className="hidden items-center gap-1 md:flex">
              {navLinks.map((link) => {
                const isActive = isActiveLink(link.href);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                      isActive
                        ? "bg-zinc-100 text-zinc-950"
                        : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-2">
            {/* VERSION */}
            <span className="hidden font-mono text-xs text-zinc-400 xl:inline">
              V2
            </span>

            {/* NEW ORDER */}
            <Link
              href="/new-order"
              className="whitespace-nowrap rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
            >
              + New Order
            </Link>

            {/* DESKTOP LOGOUT */}
            <button
              onClick={handleLogout}
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-zinc-500 transition hover:bg-red-50 hover:text-red-700 md:block"
            >
              Logout
            </button>

            {/* MOBILE LOGOUT */}
            <button
              onClick={handleLogout}
              className="rounded-lg p-2 text-zinc-500 transition hover:bg-red-50 hover:text-red-700 md:hidden"
              title="Logout"
              aria-label="Logout"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* MOBILE NAVIGATION */}
        <nav className="flex overflow-x-auto border-t border-zinc-100 px-4 md:hidden">
          {navLinks.map((link) => {
            const isActive = isActiveLink(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`whitespace-nowrap border-b-2 px-3 py-3 text-xs font-medium transition ${
                  isActive
                    ? "border-zinc-900 text-zinc-900"
                    : "border-transparent text-zinc-500"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>
      </header>

      {/* STITCH DIVIDER */}
      <div className="border-b border-dashed border-zinc-300" />
    </>
  );
}