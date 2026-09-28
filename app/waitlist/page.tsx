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

  const { count, error } = await supabase
    .from("waitlist")
    .select("*", {
      count: "exact",
      head: true,
    });

  if (error) {
    console.error("PRE-ORDER COUNT ERROR:", error);
    setCountLoading(false);
    return;
  }

  setPreorderCount(count ?? 0);
  setCountLoading(false);
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
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col lg:grid lg:grid-cols-2">

        {/* IMAGE SLIDER */}
        <section className="px-4 pt-4 sm:px-6 sm:pt-6 lg:flex lg:items-center lg:justify-center lg:p-10">
          <div className="w-full max-w-xl">

            {/* IMAGE */}
            <div
              className="
                relative
                touch-pan-y
                select-none
                overflow-hidden
                rounded-[24px]
                sm:rounded-[28px]
              "
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
                  className="
                    h-auto
                    w-full
                    max-h-[68vh]
                    object-cover
                    lg:max-h-none
                  "
                />
              </div>

              {/* PREVIOUS */}
              <button
                type="button"
                onClick={previousSlide}
                aria-label="Previous image"
                className="
                  absolute
                  left-3
                  top-1/2
                  flex
                  h-11
                  w-11
                  -translate-y-1/2
                  items-center
                  justify-center
                  rounded-full
                  border border-white/20
                  bg-black/50
                  text-2xl
                  text-white
                  backdrop-blur-md
                  transition
                  active:scale-95
                  hover:bg-black/70
                "
              >
                ‹
              </button>

              {/* NEXT */}
              <button
                type="button"
                onClick={nextSlide}
                aria-label="Next image"
                className="
                  absolute
                  right-3
                  top-1/2
                  flex
                  h-11
                  w-11
                  -translate-y-1/2
                  items-center
                  justify-center
                  rounded-full
                  border border-white/20
                  bg-black/50
                  text-2xl
                  text-white
                  backdrop-blur-md
                  transition
                  active:scale-95
                  hover:bg-black/70
                "
              >
                ›
              </button>
            </div>

            {/* SLIDE INDICATOR */}
            <div className="mt-4 flex items-center justify-center gap-4">

              <span className="text-xs text-white/35">
                {currentSlide + 1} / {SLIDES.length}
              </span>

              <div className="flex gap-2">
                {SLIDES.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() =>
                      setCurrentSlide(index)
                    }
                    aria-label={`View image ${
                      index + 1
                    }`}
                    className={`
                      h-2
                      rounded-full
                      transition-all
                      ${
                        currentSlide === index
                          ? "w-6 bg-white"
                          : "w-2 bg-white/25 hover:bg-white/50"
                      }
                    `}
                  />
                ))}
              </div>

            </div>

            {/* MOBILE SWIPE HINT */}
            <p className="mt-3 text-center text-[11px] text-white/30 sm:hidden">
              Swipe to view more
            </p>

          </div>
        </section>

        {/* RIGHT SIDE */}
        <section className="flex items-center px-5 py-8 sm:px-10 sm:py-12 lg:px-16">
          <div className="mx-auto w-full max-w-md">

            {!submitted ? (
              <>

                {/* CENTERED LOGO */}
                <div className="mb-8 flex justify-center sm:mb-10">
                  <Image
                    src="/logo.png"
                    alt="Imbento Bags"
                    width={130}
                    height={55}
                    className="h-auto w-auto"
                    priority
                  />
                </div>

                {/* INTRO */}
                <div className="mb-8 text-center">
                  <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                    Pre-order the Traffic Handbag.
                  </h1>

                  <p className="mt-4 text-sm leading-6 text-white/60 sm:mt-5 sm:text-base sm:leading-7">
                    Choose your colorway and reserve your Traffic Handbag.
                    We&apos;ll contact you with payment and production details.
                  </p>
                </div>

                {/* PRICE */}
                <div className="mb-8 flex items-center justify-between border-y border-white/10 py-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">
                      Traffic Handbag
                    </p>

                    <p className="mt-1 text-sm text-white/50">
                      Price
                    </p>
                  </div>

                  <p className="text-2xl font-black tracking-tight">
                    ₱1,999
                  </p>
                </div>

                {/* PRE-ORDER COUNTDOWN */}
<div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.04] p-5">

  <div className="flex items-end justify-between gap-4">

    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">
        Limited First Batch
      </p>

      <p className="mt-2 text-sm text-white/50">
        Pre-order availability
      </p>
    </div>

    <div className="text-right">
      {countLoading ? (
        <p className="text-sm text-white/40">
          Checking...
        </p>
      ) : (
        <>
          <p className={`text-4xl font-black tracking-tight ${availabilityColor}`}>
            {remainingSlots}
          </p>

          <p className="mt-1 text-xs text-white/40">
            of {PREORDER_LIMIT} spots left
          </p>
        </>
      )}
    </div>

  </div>

  {!countLoading && (
    <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
      <div
        className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
        style={{
          width: `${
            (remainingSlots / PREORDER_LIMIT) * 100
          }%`,
        }}
      />
    </div>
  )}

  {!countLoading && preorderFull && (
    <p className="mt-4 text-sm font-semibold text-red-300">
      The first batch is fully reserved.
    </p>
  )}

</div>

                

                {/* FORM */}
                <form
                  onSubmit={handleSubmit}
                  className="space-y-5 sm:space-y-6"
                >

                  {/* NAME */}
                  <div>
                    <label
                      htmlFor="name"
                      className="mb-2 block text-sm font-semibold"
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
                      onChange={(e) =>
                        setName(e.target.value)
                      }
                      placeholder="Your name"
                      autoComplete="name"
                      disabled={loading}
                      className="
                        w-full
                        rounded-xl
                        border border-white/15
                        bg-white/5
                        px-4
                        py-3
                        text-white
                        outline-none
                        transition
                        placeholder:text-white/30
                        focus:border-white/50
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                        sm:py-3.5
                      "
                    />
                  </div>

                  {/* EMAIL */}
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-sm font-semibold"
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
                      onChange={(e) =>
                        setEmail(e.target.value)
                      }
                      placeholder="you@email.com"
                      autoComplete="email"
                      inputMode="email"
                      disabled={loading}
                      className="
                        w-full
                        rounded-xl
                        border border-white/15
                        bg-white/5
                        px-4
                        py-3
                        text-white
                        outline-none
                        transition
                        placeholder:text-white/30
                        focus:border-white/50
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                        sm:py-3.5
                      "
                    />
                  </div>

                  {/* COLORWAY */}
                  <div>
                    <label
                      htmlFor="bag"
                      className="mb-2 block text-sm font-semibold"
                    >
                      Colorway
                    </label>

                    <select
                      id="bag"
                      name="bag"
                      required
                      value={bagChoice}
                      onChange={(e) =>
                        setBagChoice(e.target.value)
                      }
                      disabled={loading}
                      className="
                        w-full
                        rounded-xl
                        border border-white/15
                        bg-black
                        px-4
                        py-3
                        text-white
                        outline-none
                        transition
                        focus:border-white/50
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                        sm:py-3.5
                      "
                    >
                      <option value="">
                        Select your colorway
                      </option>

                      {BAG_OPTIONS.map((bag) => (
                        <option
                          key={bag}
                          value={bag}
                        >
                          {bag}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* ERROR */}
                  {error && (
                    <div
                      role="alert"
                      className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300"
                    >
                      {error}
                    </div>
                  )}

                  {/* SUBMIT */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="
                      w-full
                      rounded-xl
                      bg-white
                      px-5
                      py-3.5
                      text-sm
                      font-bold
                      text-black
                      transition
                      hover:bg-white/85
                      active:scale-[0.99]
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                      sm:py-4
                      sm:text-base
                    "
                  >
                    {loading
                      ? "Submitting..."
                      : "Pre-Order →"}
                  </button>

                  {/* CONSENT */}
                  <p className="text-center text-xs leading-5 text-white/40">
                    No payment is required yet. Your pre-order reserves
                    your selected Traffic Handbag colorway. We&apos;ll
                    contact you with payment and production details.
                  </p>

                </form>
              </>
            ) : (
              /* SUCCESS */
              <div className="flex min-h-[500px] items-center">
                <div className="w-full">

                  <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04]">

                    {/* CARD HEADER */}
                    <div className="border-b border-white/10 px-6 py-6 sm:px-8">

                      <div className="flex justify-center">
                        <Image
                          src="/logo.png"
                          alt="Imbento Bags"
                          width={105}
                          height={45}
                          className="h-auto w-auto"
                        />
                      </div>

                      <div className="mt-4 text-center">
                        <span className="inline-flex rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
                          Pre-order received
                        </span>
                      </div>

                    </div>

                    {/* CARD BODY */}
                    <div className="p-6 text-center sm:p-8">

                      <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                        Your pre-order is in.
                      </h1>

                      <p className="mt-5 break-words text-sm leading-6 text-white/60 sm:text-base sm:leading-7">
                        Thanks,{" "}
                        <strong className="font-semibold text-white">
                          {name}
                        </strong>
                        . We&apos;ve received your pre-order for the{" "}
                        <strong className="font-semibold text-white">
                          {bagChoice}
                        </strong>{" "}
                        Traffic Handbag. We&apos;ll email you at{" "}
                        <strong className="font-semibold text-white">
                          {email}
                        </strong>{" "}
                        with payment and production details.
                      </p>

                      {/* COLORWAY */}
                      <div className="mt-8 rounded-2xl border border-white/10 bg-black/40 p-5">

                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35">
                          Selected colorway
                        </p>

                        <p className="mt-2 text-xl font-bold">
                          {bagChoice}
                        </p>

                      </div>

                      {/* NOTE */}
                      <div className="mt-7 border-t border-white/10 pt-6">

                        <p className="text-xs leading-5 text-white/35 sm:text-sm sm:leading-6">
                          No payment has been made yet. We&apos;ll contact
                          you once your Traffic Handbag is ready for the
                          next step. Thank you!
                        </p>

                      </div>

                    </div>
                  </div>

                </div>
              </div>
            )}

          </div>
        </section>

      </div>
    </main>
  );
}