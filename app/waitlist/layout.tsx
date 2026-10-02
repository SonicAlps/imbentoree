// app/waitlist/layout.tsx

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Traffic Handbag Pre-Order | Imbento Bags",
  description:
    "Pre-order the Traffic Handbag by Imbento Bags. Choose your colorway and reserve your slot.",

  openGraph: {
  title: "Traffic Handbag Pre-Order | Imbento Bags",
  description:
    "Choose your Traffic Handbag colorway and reserve your pre-order slot.",
  url: "https://imbentoree.vercel.app/waitlist",
  siteName: "Imbento Bags",
  images: [
    {
      url: "/traffic-handbag-handmade.webp",
      width: 1122,
      height: 1402,
      alt: "Traffic Handbag by Imbento Bags",
    },
  ],
  type: "website",
},

  twitter: {
    card: "summary_large_image",
    title: "Traffic Handbag Pre-Order | Imbento Bags",
    description:
      "Choose your Traffic Handbag colorway and reserve your pre-order slot.",
  },
};

export default function WaitlistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}