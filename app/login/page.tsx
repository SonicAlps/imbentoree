"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image"; 
import { supabase } from "@/src/lib/supabase";


export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    console.log("1. Login submitted");

    setIsLoading(true);
    setErrorMessage("");

    console.log("2. About to call Supabase");

    try {
      const result = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("3. Supabase returned:", result);

      if (result.error) {
        console.log("4. Supabase error:", result.error);

        setErrorMessage(result.error.message);
        setIsLoading(false);
        return;
      }

      console.log("5. Login successful");

      router.push("/orders");
    } catch (err) {
      console.error("6. Login threw an exception:", err);
      setErrorMessage("Something went wrong while signing in.");
      setIsLoading(false);
    }
  }

  return (
  <div className="flex min-h-screen flex-col items-center justify-start bg-zinc-100 px-6 pt-20">

    <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm">

      {/* ← UPDATED THIS SECTION */}
      <div className="mb-8 flex items-center gap-4">
        <Image
        src="/logo.png"
        alt="Imbentoree Logo"
        width={80}
        height={80}
        className="rounded-md object-contain"
        priority />
        
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">
            Imbentoree
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Sign in to manage your orders.
          </p>
        </div>
      </div>

        <form onSubmit={handleLogin} className="space-y-5">

          <div>
            <label className="text-sm font-medium text-zinc-800">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-2 w-full rounded-lg border px-4 py-3 text-zinc-900 outline-none focus:border-zinc-400"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-800">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-2 w-full rounded-lg border px-4 py-3 text-zinc-900 outline-none focus:border-zinc-400"
              placeholder="••••••••"
            />
          </div>

          {errorMessage && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-black px-5 py-3 font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>

        </form>
      </div>
    </div>
  );
}