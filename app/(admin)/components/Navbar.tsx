"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/src/lib/supabase";  // ← ADD THIS

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();  // ← ADD THIS

  const navLinks = [
  { name: "Dashboard", href: "/" },
  { name: "Orders", href: "/orders" },  // ← "New Order" removed
];

  // ← ADD THIS FUNCTION
  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");  // Redirect to login page
  }

  if (pathname === "/login") {
    return null;  // Don't render navbar on login page
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-15 py-4">
          {/* LOGO & BRANDING */}
          <Link href="/" className="flex items-center gap-3 group">
            <Image
              src="/logo.png"
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
            <Link
            href="/new-order"
            className="rounded-lg bg-red-300 px-4 py-2 text-sm font-medium text-red-900 hover:bg-zinc-300 transition">
              New Order + 
              </Link>

<span className="font-mono text-xs text-zinc-400">V1.5 · Dashboard</span>

            {/* ← ADD LOGOUT BUTTON */}
            <button
              onClick={handleLogout}
              className="ml-4 rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition"
            >
              Logout
            </button>
          </nav>
        </div>
      </header>

      {/* STITCH DIVIDER */}
      <div className="border-b border-dashed border-zinc-300" />
    </>
  );
}