export const products = {
  Pouch: {
    outerFabric: [
      "Black",
      "Army Green",
      "Red",
      "Dark Pink",
      "Orange",
      "Neon Green",
    ],
    innerFabric: [
      "Black",
      "Army Green",
      "Red",
      "Dark Pink",
      "Orange",
      "Neon Green",
    ],
    strapSize: ["1 inch", "1.5 inch", "Paracord"],
    strapColor: ["Black", "Army Green", "Orange", "Red"],
    mountingType: ["Sling Hook", "Buckle"],
    basePrice: 750,

    costHistory: [
      {
        effectiveFrom: "2026-01-01T00:00:00+08:00",
        cost: 0, // replace with estimated Pouch cost
      },
    ],
  },

  "Small Sling": {
    outerFabric: [
      "Black",
      "Army Green",
      "Red",
      "Dark Pink",
      "Orange",
      "Neon Green",
    ],
    innerFabric: [
      "Black",
      "Army Green",
      "Red",
      "Dark Pink",
      "Orange",
      "Neon Green",
    ],
    strapSize: ["1 inch", "1.5 inch", "Paracord"],
    strapColor: ["Black", "Army Green", "Orange", "Red"],
    mountingType: ["Sling Hook", "Buckle"],
    basePrice: 1499,

    costHistory: [
      {
        effectiveFrom: "2026-01-01T00:00:00+08:00",
        cost: 0, // replace with estimated Small Sling cost
      },
    ],
  },

  "Big Sling": {
    outerFabric: [
      "Black",
      "Army Green",
      "Red",
      "Dark Pink",
      "Orange",
      "Neon Green",
    ],
    innerFabric: [
      "Black",
      "Army Green",
      "Red",
      "Dark Pink",
      "Orange",
      "Neon Green",
    ],
    strapSize: ["1 inch", "1.5 inch", "Paracord"],
    strapColor: ["Black", "Army Green", "Orange", "Red"],
    mountingType: ["Sling Hook", "Buckle"],
    basePrice: 1999,

    costHistory: [
      {
        effectiveFrom: "2026-01-01T00:00:00+08:00",
        cost: 0, // replace with estimated Big Sling cost
      },
    ],
  },

  Handbag: {
    outerFabric: [
      "Black",
      "Army Green",
      "Red",
      "Dark Pink",
      "Orange",
      "Neon Green",
      "Grass green",
      "Light Blue",
    ],
    innerFabric: [
      "Black",
      "Army Green",
      "Red",
      "Dark Pink",
      "Orange",
      "Neon Green",
      "Grass green",
      "Light Blue",
    ],
    strapSize: ["1 inch", "1.5 inch", "Paracord"],
    strapColor: [
      "Black",
      "Army Green",
      "Orange",
      "Red",
      "Pink",
    ],
    mountingType: ["Sling Hook", "Buckle"],
    basePrice: 1999,

    costHistory: [
      {
        effectiveFrom: "2026-01-01T00:00:00+08:00",
        cost: 0, // replace with estimated Handbag cost
      },
    ],
  },
} as const;

export type ProductName = keyof typeof products;

/*
 * Returns the estimated cost that was active
 * when the order was created.
 *
 * Example:
 *
 * costHistory: [
 *   {
 *     effectiveFrom: "2026-01-01T00:00:00+08:00",
 *     cost: 400,
 *   },
 *   {
 *     effectiveFrom: "2026-10-03T00:00:00+08:00",
 *     cost: 450,
 *   },
 * ]
 *
 * A September 2026 order uses ₱400.
 * An October 2026 order uses ₱450.
 */
export function getProductCost(
  productName: ProductName,
  orderDate: string | Date
): number {
  const product = products[productName];

  const date =
    orderDate instanceof Date
      ? orderDate
      : new Date(orderDate);

  const applicableCosts = [...product.costHistory]
    .filter(
      (entry) =>
        new Date(entry.effectiveFrom).getTime() <=
        date.getTime()
    )
    .sort(
      (a, b) =>
        new Date(b.effectiveFrom).getTime() -
        new Date(a.effectiveFrom).getTime()
    );

  return applicableCosts[0]?.cost ?? 0;
}