"use client";



import Image from "next/image";

import {

  FormEvent,

  TouchEvent,

  useEffect,

  useRef,

  useState,

} from "react";



import { supabase } from "@/src/lib/supabase";



const BAG_OPTIONS = [

  "Watermelon",

  "Bubble Gum",

  "Orange and Lime",

];



const SLIDES = [

  {

    src: "/traffic-handbag-handmade.webp",

    alt: "Traffic Handbag handmade in the Philippines",

  },

  {

    src: "/traffic-handbag-essentialdimension.webp",

    alt: "Traffic Handbag Essential Dimension",

  },

  {

    src: "/traffic-handbag-colors.webp",

    alt: "Traffic Handbag mix and match colors",

  },

  {

    src: "/traffic-handbag-hero.webp",

    alt: "Traffic Handbag campaign poster",

  },

  {

    src: "/traffic-handbag-dimensions.webp",

    alt: "Traffic Handbag dimensions",

  },

  {

    src: "/traffic-handbag-lifestyle.webp",

    alt: "Traffic Handbag outdoor lifestyle",

  },

];



const PREORDER_LIMIT = 15;



export default function WaitlistPage() {

  const [name, setName] = useState("");

  const [email, setEmail] = useState("");

  const [bagChoice, setBagChoice] = useState("");



  const [loading, setLoading] = useState(false);

  const [submitted, setSubmitted] = useState(false);

  const [error, setError] = useState("");



  const [preorderCount, setPreorderCount] = useState(0);

  const [countLoading, setCountLoading] = useState(true);



  const [currentSlide, setCurrentSlide] = useState(0);



  useEffect(() => {

    const timer = setTimeout(() => {

      setCurrentSlide((current) =>

        current === SLIDES.length - 1 ? 0 : current + 1

      );

    }, 5000);



    return () => clearTimeout(timer);

  }, [currentSlide]);



  useEffect(() => {

  fetchPreorderCount();

}, []);



  const touchStartX = useRef<number | null>(null);

  const touchEndX = useRef<number | null>(null);



  function nextSlide() {

    setCurrentSlide((current) =>

      current === SLIDES.length - 1 ? 0 : current + 1

    );

  }



  function previousSlide() {

    setCurrentSlide((current) =>

      current === 0 ? SLIDES.length - 1 : current - 1

    );

  }



  function handleTouchStart(

    e: TouchEvent<HTMLDivElement>

  ) {

    touchEndX.current = null;

    touchStartX.current = e.targetTouches[0].clientX;

  }



  function handleTouchMove(

    e: TouchEvent<HTMLDivElement>

  ) {

    touchEndX.current = e.targetTouches[0].clientX;

  }



  function handleTouchEnd() {

    if (

      touchStartX.current === null ||

      touchEndX.current === null

    ) {

      return;

    }



    const distance =

      touchStartX.current - touchEndX.current;



    const minimumSwipeDistance = 50;



    if (distance > minimumSwipeDistance) {

      nextSlide();

    }



    if (distance < -minimumSwipeDistance) {

      previousSlide();

    }



    touchStartX.current = null;

    touchEndX.current = null;

  }



async function fetchPreorderCount() {

  setCountLoading(true);



  try {

    const { data, error } = await supabase.rpc(

      "get_waitlist_count"

    );



    if (error) {

      console.error(

        "PRE-ORDER COUNT ERROR:",

        error

      );



      return;

    }



    setPreorderCount(data ?? 0);

  } catch (error) {

    console.error(

      "PRE-ORDER COUNT ERROR:",

      error

    );

  } finally {

    setCountLoading(false);

  }

}









  async function handleSubmit(

    e: FormEvent<HTMLFormElement>

  ) {

    e.preventDefault();



    if (loading) return;



    setError("");



    const cleanName = name.trim();

    const cleanEmail = email.trim().toLowerCase();



    if (!cleanName || !cleanEmail || !bagChoice) {

      setError("Please complete all fields.");

      return;

    }



    setLoading(true);



    const { error: insertError } = await supabase

      .from("waitlist")

      .insert({

        name: cleanName,

        email: cleanEmail,

        bag_choice: bagChoice,

      });



    setLoading(false);



    if (insertError) {

  console.error(

    "WAITLIST INSERT ERROR:",

    insertError

  );



  if (

    insertError.message?.includes(

      "PREORDER_LIMIT_REACHED"

    )

  ) {

    setPreorderCount(PREORDER_LIMIT);



    setError(

      "The first batch of 15 Traffic Handbags is fully reserved."

    );



    return;

  }



  if (insertError.code === "23505") {

    setError(

      "You've already pre-ordered this colorway."

    );



    return;

  }



  setError(

    "We couldn't submit your pre-order. Please try again."

  );



  return;

}



    setName(cleanName);

    setEmail(cleanEmail);

    setSubmitted(true);

  }



const remainingSlots = Math.max(

  PREORDER_LIMIT - preorderCount,

  0

);



const availabilityColor =

  remainingSlots === 0

    ? "text-red-400"

    : remainingSlots === 1

    ? "text-red-400"

    : remainingSlots <= 3

    ? "text-amber-400"

    : "text-green-400";



const progressColor =

  remainingSlots === 0

    ? "bg-red-500"

    : remainingSlots === 1

    ? "bg-red-500"

    : remainingSlots <= 3

    ? "bg-amber-400"

    : "bg-green-400";







const preorderFull = remainingSlots === 0;







  return (
    <main className="min-h-screen bg-white text-black">
      <div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[1.08fr_0.92fr]">
        {/* CAMPAIGN / GALLERY */}
        <section className="border-b border-black lg:border-b-0 lg:border-r">
          <div className="flex min-h-full flex-col p-4 sm:p-6 lg:p-8">
            <div className="flex items-center justify-between border-b border-black pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Imbento Bags
                </p>
                <p className="mt-1 text-sm font-medium text-black">
                  Traffic Handbag / First Batch
                </p>
              </div>

              <p className="text-xs font-medium text-zinc-500">
                {String(currentSlide + 1).padStart(2, "0")} /{" "}
                {String(SLIDES.length).padStart(2, "0")}
              </p>
            </div>

            <div className="flex flex-1 items-center py-6 lg:py-8">
              <div className="w-full">
                <div
                  className="relative touch-pan-y select-none overflow-hidden border border-black bg-zinc-50"
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  <div
                    key={currentSlide}
                    className="carousel-image-enter"
                  >
                    <Image
                      src={SLIDES[currentSlide].src}
                      alt={SLIDES[currentSlide].alt}
                      width={1080}
                      height={1350}
                      priority={currentSlide === 0}
                      draggable={false}
                      className="h-auto max-h-[72vh] w-full object-cover lg:max-h-[78vh]"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={previousSlide}
                    aria-label="Previous image"
                    className="absolute bottom-4 left-4 flex h-11 w-11 items-center justify-center border border-black bg-white text-xl text-black transition hover:bg-black hover:text-white active:scale-95"
                  >
                    ←
                  </button>

                  <button
                    type="button"
                    onClick={nextSlide}
                    aria-label="Next image"
                    className="absolute bottom-4 left-[60px] flex h-11 w-11 items-center justify-center border border-black bg-white text-xl text-black transition hover:bg-black hover:text-white active:scale-95"
                  >
                    →
                  </button>
                </div>

                <div className="mt-4 flex items-center justify-between gap-4">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-400">
                    Swipe or use arrows
                  </p>

                  <div className="flex items-center gap-2">
                    {SLIDES.map((_, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setCurrentSlide(index)}
                        aria-label={`View image ${index + 1}`}
                        className={`h-2 border border-black transition-all ${
                          currentSlide === index
                            ? "w-7 bg-black"
                            : "w-2 bg-white hover:bg-zinc-200"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-black pt-4">
              <p className="max-w-xl text-xs leading-5 text-zinc-500">
                Handmade in the Philippines. Designed and produced in small
                batches by Imbento Bags.
              </p>
            </div>
          </div>
        </section>

        {/* PRE-ORDER PANEL */}
        <section className="flex items-center bg-white">
          <div className="w-full px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
            <div className="mx-auto w-full max-w-lg">
              {!submitted ? (
                <>
                  <div className="mb-10">
                    <div className="inline-flex border border-black bg-black px-4 py-2">
                      <Image
                        src="/logo.png"
                        alt="Imbento Bags"
                        width={112}
                        height={48}
                        className="h-auto w-auto"
                        priority
                      />
                    </div>
                  </div>

                  <div className="border-b border-black pb-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                      Pre-order
                    </p>

                    <h1 className="mt-3 text-4xl font-bold leading-none tracking-tight sm:text-5xl">
                      Traffic Handbag
                    </h1>

                    <p className="mt-5 max-w-md text-sm leading-6 text-zinc-600 sm:text-base sm:leading-7">
                      A compact-sized bag for your most valuable essentials.
                      Choose your colorway and reserve a slot from the first
                      production batch.
                    </p>

                    <div className="mt-7 flex items-end justify-between gap-6">
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                          Price
                        </p>
                        <p className="mt-1 text-3xl font-bold tracking-tight">
                          ₱1,999
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                          Batch size
                        </p>
                        <p className="mt-1 text-sm font-semibold">
                          {PREORDER_LIMIT} pieces
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-b border-black py-7">
                    <div className="flex items-end justify-between gap-6">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                          Availability
                        </p>
                        <p className="mt-2 text-sm text-zinc-600">
                          Limited first production batch
                        </p>
                      </div>

                      <div className="text-right">
                        {countLoading ? (
                          <p className="text-sm text-zinc-500">
                            Checking...
                          </p>
                        ) : (
                          <>
                            <p
                              className={`text-5xl font-bold leading-none tracking-tight ${availabilityColor}`}
                            >
                              {remainingSlots}
                            </p>
                            <p className="mt-2 text-xs text-zinc-500">
                              spots left
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    {!countLoading && (
                      <div className="mt-5 h-2 border border-black bg-white">
                        <div
                          className={`h-full transition-all duration-500 ${progressColor}`}
                          style={{
                            width: `${
                              (remainingSlots / PREORDER_LIMIT) * 100
                            }%`,
                          }}
                        />
                      </div>
                    )}

                    {!countLoading && preorderFull && (
                      <p className="mt-4 text-sm font-semibold text-red-600">
                        The first batch is fully reserved.
                      </p>
                    )}
                  </div>

                  <form
                    onSubmit={handleSubmit}
                    className="pt-7"
                  >
                    <div className="grid gap-5">
                      <div>
                        <label
                          htmlFor="name"
                          className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-zinc-600"
                        >
                          Name
                        </label>

                        <input
                          id="name"
                          name="name"
                          type="text"
                          required
                          minLength={2}
                          maxLength={100}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your name"
                          autoComplete="name"
                          disabled={loading}
                          className="w-full border border-black bg-white px-4 py-3 text-sm text-black outline-none transition placeholder:text-zinc-400 focus:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 sm:py-3.5"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="email"
                          className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-zinc-600"
                        >
                          Email
                        </label>

                        <input
                          id="email"
                          name="email"
                          type="email"
                          required
                          maxLength={254}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@email.com"
                          autoComplete="email"
                          inputMode="email"
                          disabled={loading}
                          className="w-full border border-black bg-white px-4 py-3 text-sm text-black outline-none transition placeholder:text-zinc-400 focus:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 sm:py-3.5"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="bag"
                          className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-zinc-600"
                        >
                          Colorway
                        </label>

                        <select
                          id="bag"
                          name="bag"
                          required
                          value={bagChoice}
                          onChange={(e) => setBagChoice(e.target.value)}
                          disabled={loading}
                          className="w-full border border-black bg-white px-4 py-3 text-sm text-black outline-none transition focus:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 sm:py-3.5"
                        >
                          <option value="">
                            Select your colorway
                          </option>

                          {BAG_OPTIONS.map((bag) => (
                            <option key={bag} value={bag}>
                              {bag}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {error && (
                      <div
                        role="alert"
                        className="mt-5 border border-red-600 bg-red-50 px-4 py-3 text-sm text-red-700"
                      >
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading || preorderFull}
                      className="mt-6 w-full border border-black bg-black px-5 py-4 text-sm font-bold uppercase tracking-[0.12em] text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {loading
                        ? "Submitting..."
                        : preorderFull
                        ? "First Batch Full"
                        : "Pre-Order →"}
                    </button>

                    <p className="mt-4 text-center text-xs leading-5 text-zinc-500">
                      No payment is required yet. Your pre-order reserves your
                      selected Traffic Handbag colorway. We&apos;ll contact you
                      with payment and production details.
                    </p>
                  </form>
                </>
              ) : (
                <div className="border border-black bg-white">
                  <div className="border-b border-black p-6 sm:p-8">
                    <div className="flex items-start justify-between gap-6">
                      <div className="inline-flex border border-black bg-black px-4 py-2">
                        <Image
                          src="/logo.png"
                          alt="Imbento Bags"
                          width={105}
                          height={45}
                          className="h-auto w-auto"
                        />
                      </div>

                      <span className="border border-black px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-black">
                        Pre-order received
                      </span>
                    </div>
                  </div>

                  <div className="p-6 sm:p-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                      Traffic Handbag
                    </p>

                    <h1 className="mt-3 text-4xl font-bold tracking-tight">
                      Your pre-order is in.
                    </h1>

                    <p className="mt-5 text-sm leading-7 text-zinc-600 sm:text-base">
                      Thanks,{" "}
                      <strong className="font-semibold text-black">
                        {name}
                      </strong>
                      . We&apos;ve received your pre-order for the{" "}
                      <strong className="font-semibold text-black">
                        {bagChoice}
                      </strong>{" "}
                      Traffic Handbag. We&apos;ll email you at{" "}
                      <strong className="font-semibold text-black">
                        {email}
                      </strong>{" "}
                      with payment and production details.
                    </p>

                    <div className="mt-8 grid border border-black sm:grid-cols-2">
                      <div className="border-b border-black p-5 sm:border-b-0 sm:border-r">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                          Selected colorway
                        </p>
                        <p className="mt-2 text-xl font-bold">
                          {bagChoice}
                        </p>
                      </div>

                      <div className="p-5">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                          Next step
                        </p>
                        <p className="mt-2 text-sm font-semibold">
                          Wait for our email
                        </p>
                      </div>
                    </div>

                    <div className="mt-7 border-t border-black pt-6">
                      <p className="text-xs leading-5 text-zinc-500 sm:text-sm sm:leading-6">
                        No payment has been made yet. We&apos;ll contact you
                        once your Traffic Handbag is ready for the next step.
                        Thank you!
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}